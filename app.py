import os
import logging
from flask import Flask, render_template, request, jsonify

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")

# Expanded running types with descriptions
RUNNING_TYPES = {
    'recovery': {
        'en': {'name': 'Recovery Run', 'desc': 'Easy-paced run for active recovery'},
        'sk': {'name': 'Recovery beh', 'desc': 'Pomalý beh na aktívnu regeneráciu'}
    },
    'tempo': {
        'en': {'name': 'Tempo Run', 'desc': 'Comfortably hard sustainable pace'},
        'sk': {'name': 'Tempový beh', 'desc': 'Udržateľné tempo na hranici komfortu'}
    },
    'long': {
        'en': {'name': 'Long Run', 'desc': 'Extended distance at conversational pace'},
        'sk': {'name': 'Dlhý beh', 'desc': 'Dlhá vzdialenosť konverzačným tempom'}
    },
    'fartlek': {
        'en': {'name': 'Fartlek', 'desc': 'Speed play with varied pace changes'},
        'sk': {'name': 'Fartlek', 'desc': 'Hra s rýchlosťou a zmenami tempa'}
    },
    'intervals': {
        'en': {'name': 'Interval Training', 'desc': 'High-intensity bursts with recovery'},
        'sk': {'name': 'Intervalový tréning', 'desc': 'Vysoká intenzita s odpočinkom'}
    },
    'sprint': {
        'en': {'name': 'Sprint', 'desc': 'Maximum effort short distance'},
        'sk': {'name': 'Šprint', 'desc': 'Maximálne úsilie na krátku vzdialenosť'}
    },
    'marathon': {
        'en': {'name': 'Marathon', 'desc': 'Long-distance endurance focused'},
        'sk': {'name': 'Maratón', 'desc': 'Zameranie na dlhé vzdialenosti'}
    },
    'trail': {
        'en': {'name': 'Trail Running', 'desc': 'Off-road adventure running'},
        'sk': {'name': 'Trail beh', 'desc': 'Beh v prírode mimo ciest'}
    },
    'hill': {
        'en': {'name': 'Hill Run', 'desc': 'Uphill strength and power building'},
        'sk': {'name': 'Kopčeky', 'desc': 'Budovanie sily a výkonu do kopca'}
    }
}

# Comprehensive compatibility matrix
COMPATIBILITY_MATRIX = {
    # Perfect matches (90-100%)
    ('recovery', 'recovery'): {'score': 95, 'en': 'Perfect harmony! You both value rest and recovery, creating a balanced relationship.', 'sk': 'Dokonalá harmónia! Obaja si vážite odpočinok a regeneráciu.'},
    ('marathon', 'marathon'): {'score': 98, 'en': 'Endurance soulmates! Your shared love for long distances creates an unbreakable bond.', 'sk': 'Vytrvalosť duší! Spoločná láska k dlhým vzdialenostiam vytvára nezničiteľné puto.'},
    ('trail', 'trail'): {'score': 92, 'en': 'Adventure partners! You both love exploring nature together.', 'sk': 'Dobrodružní partneri! Obaja milujete spoločné objavovanie prírody.'},
    
    # Great matches (75-89%)
    ('tempo', 'tempo'): {'score': 85, 'en': 'Precision partnership! Your structured approach creates consistency.', 'sk': 'Precízne partnerstvo! Váš štruktúrovaný prístup vytvára stálosť.'},
    ('long', 'marathon'): {'score': 88, 'en': 'Distance lovers! Perfect combination of endurance mindsets.', 'sk': 'Milovníci vzdialeností! Dokonalá kombinácia vytrvalostného myslenia.'},
    ('fartlek', 'fartlek'): {'score': 82, 'en': 'Playful spirits! Your spontaneous nature keeps things exciting.', 'sk': 'Hravé duše! Vaša spontánnosť udržiava vzťah vzrušujúci.'},
    ('intervals', 'intervals'): {'score': 79, 'en': 'High-intensity harmony! You both thrive on challenging workouts.', 'sk': 'Vysokointenzívna harmónia! Obaja prosperujete pri náročných tréningoch.'},
    ('hill', 'hill'): {'score': 86, 'en': 'Mountain climbers! You face challenges together head-on.', 'sk': 'Horolezci! Spoločne čelíte výzvám čelom vpred.'},
    
    # Good matches (60-74%)
    ('recovery', 'long'): {'score': 72, 'en': 'Balanced approach! One provides calm, the other endurance.', 'sk': 'Vyvážený prístup! Jeden poskytuje pokoj, druhý vytrvalosť.'},
    ('tempo', 'intervals'): {'score': 68, 'en': 'Structured intensity! Your training methods complement each other.', 'sk': 'Štruktúrovaná intenzita! Vaše tréningové metódy sa dopĺňajú.'},
    ('long', 'trail'): {'score': 74, 'en': 'Distance adventurers! Great combination of endurance and exploration.', 'sk': 'Vzdialenosť dobrodruzi! Skvelá kombinácia vytrvalosti a objavovania.'},
    ('fartlek', 'trail'): {'score': 71, 'en': 'Nature players! Spontaneity meets adventure perfectly.', 'sk': 'Príroda hráči! Spontánnosť sa stretáva s dobrodružstvom dokonale.'},
    ('hill', 'intervals'): {'score': 76, 'en': 'Power builders! You both love challenging, intense workouts.', 'sk': 'Budovatelia sily! Obaja milujete náročné, intenzívne tréningy.'},
    
    # Moderate matches (45-59%)
    ('recovery', 'tempo'): {'score': 52, 'en': 'Opposite energies. One seeks calm, the other structure. Compromise needed.', 'sk': 'Opačné energie. Jeden hľadá pokoj, druhý štruktúru. Potrebný kompromis.'},
    ('recovery', 'fartlek'): {'score': 48, 'en': 'Different rhythms. Steady meets spontaneous - interesting but challenging.', 'sk': 'Rôzne rytmy. Stály sa stretáva so spontánnym - zaujímavé, ale náročné.'},
    ('tempo', 'trail'): {'score': 57, 'en': 'Structure meets adventure. Can work with mutual understanding.', 'sk': 'Štruktúra sa stretáva s dobrodružstvom. Môže fungovať s vzájomným porozumením.'},
    ('long', 'fartlek'): {'score': 54, 'en': 'Steady vs. spontaneous. One plans distance, the other changes pace every 5 minutes.', 'sk': 'Stály verzus spontánny. Jeden plánuje vzdialenosť, druhý mení tempo každých 5 minút.'},
    ('sprint', 'marathon'): {'score': 45, 'en': 'Speed vs. endurance. Complete opposites that might create balance or conflict.', 'sk': 'Rýchlosť verzus vytrvalosť. Úplné opaky, ktoré môžu vytvoriť rovnováhu alebo konflikt.'},
    
    # Challenging matches (30-44%)
    ('recovery', 'intervals'): {'score': 38, 'en': 'Energy mismatch. One wants to relax, the other to push limits.', 'sk': 'Energetický nesúlad. Jeden sa chce relaxovať, druhý prekonávať limity.'},
    ('recovery', 'sprint'): {'score': 32, 'en': 'Polar opposites! One talks during runs, the other is already at the finish line.', 'sk': 'Úplné opaky! Jeden sa rozpráva počas behu, druhý je už v cieli.'},
    ('tempo', 'sprint'): {'score': 41, 'en': 'Different time zones. Sustained effort meets explosive power.', 'sk': 'Rôzne časové pásma. Udržateľné úsilie sa stretáva s explozívnou silou.'},
    ('long', 'sprint'): {'score': 35, 'en': 'Distance vs. speed. Like mixing oil and water - possible but requires work.', 'sk': 'Vzdialenosť verzus rýchlosť. Ako miešanie oleja a vody - možné, ale vyžaduje prácu.'},
    
    # Difficult matches (15-29%)
    ('recovery', 'hill'): {'score': 28, 'en': 'One seeks flat and easy, the other craves steep challenges.', 'sk': 'Jeden hľadá rovné a ľahké, druhý túži po strmých výzvach.'},
    ('intervals', 'trail'): {'score': 25, 'en': 'Structured intensity vs. natural flow. Timing rarely aligns.', 'sk': 'Štruktúrovaná intenzita verzus prirodzený tok. Načasovanie sa zriedka zhoduje.'},
    ('sprint', 'hill'): {'score': 22, 'en': 'Speed demon meets mountain goat. Very different energy systems.', 'sk': 'Rýchlostný démon sa stretáva s horskou kozou. Veľmi odlišné energetické systémy.'},
    
    # Very challenging matches (1-14%)
    ('marathon', 'sprint'): {'score': 8, 'en': 'Ultimate contradiction! Tortoise meets hare - will love conquer all?', 'sk': 'Najväčší protiklad! Korytnačka sa stretáva so zajačikom - zvíťazí láska nad všetkým?'},
}

def get_compatibility(type1, type2):
    """Get compatibility score and description for two running types"""
    key1 = (type1, type2)
    key2 = (type2, type1)
    
    if key1 in COMPATIBILITY_MATRIX:
        return COMPATIBILITY_MATRIX[key1]
    elif key2 in COMPATIBILITY_MATRIX:
        return COMPATIBILITY_MATRIX[key2]
    else:
        # Default compatibility for missing combinations
        return {
            'score': 50,
            'en': 'Unknown combination, but every relationship has potential with effort and understanding!',
            'sk': 'Neznáma kombinácia, ale každý vzťah má potenciál s úsilím a porozumením!'
        }

def get_compatibility_level(score):
    """Get compatibility level based on score"""
    if score >= 90:
        return {'en': 'Perfect Match', 'sk': 'Dokonalá zhoda', 'class': 'perfect'}
    elif score >= 75:
        return {'en': 'Great Match', 'sk': 'Skvelá zhoda', 'class': 'great'}
    elif score >= 60:
        return {'en': 'Good Match', 'sk': 'Dobrá zhoda', 'class': 'good'}
    elif score >= 45:
        return {'en': 'Moderate Match', 'sk': 'Priemerná zhoda', 'class': 'moderate'}
    elif score >= 30:
        return {'en': 'Challenging', 'sk': 'Náročné', 'class': 'challenging'}
    elif score >= 15:
        return {'en': 'Difficult', 'sk': 'Ťažké', 'class': 'difficult'}
    else:
        return {'en': 'Very Challenging', 'sk': 'Veľmi náročné', 'class': 'very-challenging'}

@app.route('/')
def index():
    lang = request.args.get('lang', 'sk')
    return render_template('index.html', running_types=RUNNING_TYPES, lang=lang)

@app.route('/calculate', methods=['POST'])
def calculate_compatibility():
    data = request.get_json()
    your_type = data.get('your_type')
    partner_type = data.get('partner_type')
    lang = data.get('lang', 'sk')
    
    if not your_type or not partner_type:
        return jsonify({'error': 'Missing running types'}), 400
    
    compatibility = get_compatibility(your_type, partner_type)
    level = get_compatibility_level(compatibility['score'])
    
    return jsonify({
        'score': compatibility['score'],
        'description': compatibility[lang],
        'level': level[lang],
        'level_class': level['class']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
