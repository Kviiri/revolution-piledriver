/*
 * REVOLUTION PILEDRIVER by Kalle Viiri
 * This is my first JS game ever.
 * Pretty much the first "game" by most definitions.
 * The code is a deeper chasm of despair the shaft will ever be.
 */

const consts = {
    ground_offset: 400, //height difference from top-of-screen to ground level normally
    friction_fraction: 0.99,
    to_metres_factor: 32,
    status_screen_width: 400,
    money_per_depth: 0.05,
    mineral_bay_cap: [0, 10, 50, 500],
    gravity_assist: [0, 0.1, 0.3, 0.5],
    booster_penetrations: [0.6, 0.8, 0.9, 0.95],
    recoil_preservations: [0.5, 0.6, 0.7, 0.8, 0.95],
    friction_fraction: [0.97, 0.98, 0.99, 0.995],
    ascension: [1, 1.5, 3, 8, 15]
}

const graph_consts = {
    space_string_ttl: 3000,
    booster_fill_styles: [undefined, '#444', '#6DD', '#539'],
    antifric: [undefined, '#444', '#AAF', '#539'],
    mineral_bay_widths: [undefined, 4, 6, 8],
    climbers: [undefined, '#444', '#AAA', '#539', '#C55'],
    endgame_str_ttl: 8000
}

const stars = [
    //big dipster
    {
        x: 421,
        y: 152,
        r: 2
    },
    {
        x: 509,
        y: 109,
        r: 2
    },
    {
        x: 601,
        y: 112,
        r: 3
    },
    {
        x: 720,
        y: 118,
        r: 1
    },
    {
        x: 750,
        y: 180,
        r: 2
    },
    {
        x: 860,
        y: 170,
        r: 2
    },
    {
        x: 860,
        y: 100,
        r: 4
    },
    //random stars because I'm too lazy to copy IRL star charts
    {
        x: 140,
        y: 89,
        r: 1
    },
    {
        x: 144,
        y: 101,
        r: 2
    },
    {
        x: 204,
        y: 301,
        r: 2
    },
    {
        x: 224,
        y: 501,
        r: 2
    },
    {
        x: 404,
        y: 404,
        r: 1
    },
    {
        x: 724,
        y: 601,
        r: 3
    },
    {
        x: 704,
        y: 621,
        r: 2
    },
    {
        x: 680,
        y: 501,
        r: 1
    },
    {
        x: 686,
        y: 503,
        r: 2
    },
    {
        x: 804,
        y: 353,
        r: 2
    },
    {
        x: 754,
        y: 340,
        r: 2
    },
    {
        x: 1001,
        y: 301,
        r: 2
    },
    {
        x: 1011,
        y: 304,
        r: 1
    },
    {
        x: 989,
        y: 301,
        r: 1
    },
    {
        x: 500,
        y: -104,
        r: 1
    },
    {
        x: 420,
        y: -84,
        r: 3
    },
    {
        x: 401,
        y: -80,
        r: 1
    },
    {
        x: 201,
        y: -64,
        r: 1
    },
    {
        x: 101,
        y: -4,
        r: 2
    },
    {
        x: 901,
        y: -8,
        r: 2
    },
    {
        x: 1101,
        y: 32,
        r: 2
    },
    {
        x: 59,
        y: 56,
        r: 1
    },
    {
        x: 1020,
        y: -201,
        r: 1
    },
    {
        x: 1030,
        y: -221,
        r: 2
    },
    {
        x: 803,
        y: -321,
        r: 2
    },
    
]

//particle:
//x (int)
//y (int)
//x_speed
//y_speed
//ttl (int)
var particles = []

var piledriver = {
    x: 450, //replace with window size parameter
    y: -64, //ground level is zero
    height: 64,
    width: 40,
    velocity: 0, //positive velocity downward
    recoil_energy: 0, //used by the recoil engine
    mineral_bay: 0, //used by mineral bay upgrade
    last_acceleration: 0 //used by grav boosters
}

var player = {
    money: 0,
    items: {
        's': 0,
        'r': 0,
        'b': 0,
        'm': 0,
        'g': 0,
        'f': 0,
        'c': 0,
        't': 0
    },
    spacetime: 0, //is spacetime continuous?
    victory: 0,
}

var chasm = {
    depth: 120,
    //depth: 100000,
    hardness: 6
}

function max_upgrades() {
    for (key in player.items) {
        player.items[key] = shop_items[key].length;
    }
    player.items['s'] = 1;
    player.items['t'] = 1;
}


//Dict, key is hotkey.
// each item is array of objects:
// - desc (String)
// - cost (int)
// - availability (function)
// - effect (function)
const shop_items= {
    's': [
        {
            desc: 'Recoil engine',
            cost: 5,
            availability: () => chasm.depth > 5 * consts.to_metres_factor,
            effect: () => player.items['s'] = 1
        },
        {
            desc: 'Disable recoil engine',
            cost: 0,
            availability: () => player.items['s'] == 1,
            effect: () => player.items['s'] = 2
        },
        {
            desc: 'Re-enable recoil engine',
            cost: 0,
            availability: () => player.items['s'] == 2,
            effect: () => player.items['s'] = 1
        }
    ],
    't': [
        {
            desc: 'Untether the piledriver!',
            cost: 500,
            availability: () => chasm.depth > 1000 * consts.to_metres_factor
                                && player.items['g'] > 0,
            effect: () => player.items['t'] = 1 
        },
        {
            desc: 'Re-tether the piledriver',
            cost: 0,
            availability: () => player.items['t'] == 1,
            effect: () => player.items['t'] = 2
        },
        {
            desc: 'Untether the piledriver again!',
            cost: 0,
            availability: () => player.items['t'] == 2,
            effect: () => player.items['t'] = 1
        }
    ],
    'r': [
        {
            desc: 'L2 recoil enhancer',
            cost: 20,
            availability: () => player.items['s'] == 1,
            effect: () => player.items['r'] = 1
        },
        {
            desc: 'L3 recoil "Angry Bouncer"',
            cost: 50,
            availability: () => player.items['r'] == 1,
            effect: () => player.items['r'] = 2
        },
        {
            desc: 'L4 recoil "Bouncy B.o.I"',
            cost: 300,
            availability: () => player.items['r'] == 2,
            effect: () => player.items['r'] = 3
        },
        {
            desc: "L5 'Pataphysical hyper-recoil",
            cost: 1500,
            availability: () => player.items['r'] == 3,
            effect: () => player.items['r'] = 4
        }
    ],
    'b': [
        {
            desc: 'L1 Impact booster',
            cost: 5,
            availability: () => chasm.depth > 10 * consts.to_metres_factor,
            effect: () => player.items['b'] = 1
        },
        {
            desc: 'L2 Reinforced booster',
            cost: 50,
            availability: () => player.items['b'] == 1,
            effect: () => player.items['b'] = 2
        },
        {
            desc: 'L3 D-Purple booster',
            cost: 200,
            availability: () => player.items['b'] == 2,
            effect: () => player.items['b'] = 3
        }
    ],
    'm': [
        {
            desc: 'L1 Mineral collector',
            cost: 15,
            availability: () => chasm.depth > 10 * consts.to_metres_factor,
            effect: () => player.items['m'] = 1
        },
        {
            desc: 'L2 Mineral bay',
            cost: 80,
            availability: () => player.items['m'] == 1,
            effect: () => player.items['m'] = 2
        },
        {
            desc: 'L3 Mineral condenser',
            cost: 350,
            availability: () => player.items['m'] == 2,
            effect: () => player.items['m'] = 3
        },
    ],
    'g': [
        {
            desc: 'L1 Gravitational boosting',
            cost: 10,
            availability: () => chasm.depth > 10 * consts.to_metres_factor,
            effect: () => player.items['g'] = 1
        },
        {
            desc: 'L2 Gravity condenser',
            cost: 60,
            availability: () => player.items['g'] == 1,
            effect: () => player.items['g'] = 2
        },
        {
            desc: 'L3 Gravi-LOHI hyperbooster', //i enjoy
            cost: 200,
            availability: () => player.items['g'] == 2,
            effect: () => player.items['g'] = 3
        }
    ],
    'f': [
        {
            desc: 'L1 Anti-frictive joint',
            cost: 15,
            availability: () => chasm.depth > 5 * consts.to_metres_factor,
            effect: () => player.items['f'] = 1
        },
        {
            desc: 'L2 Ball Bearings',
            cost: 100,
            availability: () => player.items['f'] == 1,
            effect: () => player.items['f'] = 2
        },
        {
            desc: 'L3 Magneto-magical bearings',
            cost: 400,
            availability: () => player.items['f'] == 2,
            effect: () => player.items['f'] = 3
        },
    ],
    'c': [
        {
            desc: "L1 Climbing Aid",
            cost: 180,
            availability: () => chasm.depth > 250 * consts.to_metres_factor,
            effect: () => player.items['c'] = 1
        },
        {
            desc: "L2 Y-axial Decrementors",
            cost: 350,
            availability: () => player.items['c'] == 1,
            effect: () => player.items['c'] = 2
        },
        {
            desc: "L3 Antigrav Boosters",
            cost: 600,
            availability: () => player.items['c'] == 2,
            effect: () => player.items['c'] = 3
        },
        {
            desc: "L4 Aide-de-Ascendance",
            cost: 3000,
            availability: () => player.items['c'] == 3,
            effect: () => player.items['c'] = 4
        },
    ],
}

//each advice_string is String[] + condition(function)
const advice_strings= [
    /*
     * Intro event. Fires only at the start.
     */
    {
        advice: ["Hey, welcome to the Shaft.",
                 "Earn money by making the hole deeper.",
                 "Keep on pounding and check back for",
                 "uprades in the Shapft!"],
        availability: () => false
    },
    /*
     * GENERAL GAMEPLAY INFO
     */
    {
        advice: ["You get paid for deepening the shaft.",
                 "The rate is roughly 1.5₽ / 1 metre.",
                 "Though of course you are not doing",
                 "this for the money, right?"],
        availability: () => true
    },
    {
        advice: ["The ground is relatively soft here, but",
                 "striking at it at higher speeds will",
                 "get you way deeper. Pick up speed and",
                 "SMASH into the ground!"],
        availability: () => true
    },
    {
        advice: ["Upgrades can have nice synergies.",
                 "Recoil engines will bounce you back",
                 "after impact, and grav boosters will",
                 "send you down again.",
                 "Combo hits against Mother Earth!"],
        availability: () => true
    },
    /*
     * GAGARIN / SPACE arc 
     */
    {
        advice: ["Did you hear about Ltn. Gagarin?",
                 "He would've been the first human in",
                 "space if not for the terrible launch",
                 "accident. Rest his soul."],
        availability: () => true
    },
    {
        advice: ["Space is the realm of wonder and terror.",
                 "Many good people have been lost already",
                 "trying to uncover its secrets.",
                 "It is the deepest realm."
                 ],
        availability: () => true
    },
    {
        advice: ["Is it true you wanted to be a cosmonaut?",
                 "You should be happy you didn't make it.",
                 "Those rockets are nothing but dangerous",
                 "death traps. We shouldn't strap our most",
                 "brave officers in them to die."
                 ],
        availability: () => true
    },
    {
        advice: ["The space program has been suspended.",
                 "Rockets are too dangerous for human",
                 "spaceflight. With no alternative",
                 "we will remain here on Earth.",
                 "At least we have the shaft."
                 ],
        availability: () => true
    },
    /*
     * GENERAL FUN STUFF
     */
    {
        advice: ["Hi Sasha, how have you been?",
                 "Even though you didn't get to space",
                 "academy, I love you and respect your",
                 "work. You don't need to be a cosmonaut",
                 "to bring joy to the world. --Dad"],
        availability: () => true
    },
    {
        advice: ["Hello Sasha.",
                 "They showed your hole on the local news",
                 "today and mom was super proud. It takes",
                 "persistence to get that deep. Respect.",
                 "--Dad"],
        availability: () => chasm.depth > 100 * consts.to_metres_factor
    },
    {
        advice: ["Why is this font monospace and centered,",
                 "it doesn't align right and looks bad.",
                 "",
                 "Sorry, you can't unsee it."],
        availability: () => true
    },
    {
        advice: ["Have you already heard the tale of",
                 "the Egyptian solar deity? They named",
                 "a harbor basin after him in Finland.",
                 "Weird... but (maybe) true!"],
        availability: () => true
    },
    {
        advice: ["I was under the impression that a",
                 "piledriver should drive piles in the",
                 "ground, not just hammer a hole in it.",
                 "",
                 "Must be the artistic licence at play."],
        availability: () => true
    },
    /*
     * RECOIL ENGINE ADS/PSAs
     */
    {
        advice: ["The recoil engine is a marvel of our",
                 "piledriver technology. It converts",
                 "some of your impact energy back to up-",
                 "wards motion. Get it ASAP!"
                 ],
        availability: () => player.items['s'] == 0
    },
    {
        advice: ["Look, my boss is going to kill me",
                 "if he finds out I couldn't sell you",
                 "one of these recoil engines. Buy one.",
                 "Please..."],
        availability: () => player.items['s'] == 0
    },
    {
        advice: ["Hey Sasha, it's Mom.",
                 "Remember you can turn off your",
                 "recoil engines by pressing [s] when",
                 "you visit the surface. Hugs~~"],
        availability: () => player.items['s'] != 0
    },
    {
        advice: ["Cool, you've got one of those new",
                 "recoil engines? I hear they boost",
                 "productivity like crazy!"],
        availability: () => player.items['s'] != 0
    },
    /*
     * IMPACT BOOSTER ADS/PSAs
     */
     {
        advice: ["Impact boosters are heavy chunks of",
                 "highly-processed metal that improve",
                 "the penetration of your piledriver."
                 ],
        availability: shop_items['b'][0].availability
    },
    {
        advice: ["You can break even tougher soil with",
                 "that impact booster of yours!"
                 ],
        availability: () => player.items['b'] != 0
    },
    {
        advice: ["A D-Purple?! That impact booster ROCKS!",
                 "Most workers only dream of seeing one,",
                 "let alone getting to use it!"
                 ],
        availability: () => player.items['b'] == 2
    },
    /*
     * MINERAL COLLECTOR ADS/PSAs
     */
     {
        advice: ["Looking for a bit of extra income?",
                 "We could equip your piledriver with a",
                 "mineral collection bay. Bring the rocks",
                 "you crush to surface and we'll pay you."
                 ],
        availability: () => player.items['m'] == 0 && shop_items['m'][0].availability()
    },
    {
        advice: ["Better models of mineral collectors are",
                 "equipped with on-board enrichment hubs.",
                 "They compress the minerals you collect,",
                 "allowing larger cargoes."
                 ],
        availability: () => player.items['m'] != 0
    },
    {
        advice: ["Mineral collector storage caps:",
                 "L1 Collector:  10 ₽.",
                 "L2 Bay:        50 ₽.",
                 "L3 Condenser: 500 ₽.",
                 ],
        availability: () => player.items['m'] != 0
    },
    /*
     * GRAV BOOSTER ADS/PSAs
     */
     {
        advice: ["Gravitational boosters will pull your",
                 "piledriver downwards unless you've",
                 "exerted upwards motion. It will speed",
                 "you up and combined with the recoil",
                 "engine, allows hands-free operation!"],
        availability: () => player.items['g'] == 0 && shop_items['g'][0].availability()
     },
     {
        advice: ["Hi, it's Mom!",
                 "Remember your grav booster is locked",
                 "when you accelerate upwards. I was",
                 "in the design team, it uses a new",
                 "invention called \"clamps\". Hugs~~"],
        availability: () => player.items['g'] > 0
     },
     {
        advice: ["Early tier gravity boosters won't",
                 "be enough to yield nice impacts if",
                 "you don't add some force of your",
                 "own, but combined with other gear",
                 "you can strike very deep very fast."],
        availability: () => player.items['g'] > 0
     },
     {
        advice: ["That's a Gravi-LOHI?",
                 "It's the top-notch gravity solution!",
                 "I give up. Your gear is just",
                 "too hardcore to even look at."],
        availability: () => player.items['g'] == 3
     },
     /*
      * FRICTION ADS/PSA
      */
     {
        advice: ["The stock cable joint is very coarse.",
                 "It will slow the piledriver down with",
                 "time, lowering the energy of the blow.",
                 "Buy an anti-frictive joint ASAP!"],
        availability: () => player.items['f'] == 0
     },
     {
        advice: ["No one really knows how the anti-",
                 "frictive joint works, but it will",
                 "greatly reduce the friction-related",
                 "slowdown of your piledriver."],
        availability: () => player.items['f'] == 1
     },
     {
        advice: ["Sweet, are those ball bearings? They",
                 "are in short supply. Your work must've",
                 "impressed some powerful people!"],
        availability: () => player.items['f'] == 2
     },
     {
        advice: ["The magneto-magical bearings don't",
                 "make any direct contact with the",
                 "cable. That's weird, but achieves",
                 "record lows in friction slowdown."],
        availability: () => player.items['f'] == 3
     },
     /*
      * CABLE UNTETHER ADS/PSA
      */
      {
        advice: ["Head office just called.",
                 "They said if you want, you can un-",
                 "tether your piledriver to perform",
                 "airborne boosts. Sounds like a really",
                 "peculiar move."],
        availability: () => player.items['t'] != 0 && shop_items['t'][0].availability()
     }
];

const underground_strings = [
    {
        string: "Hi. Welcome to the underground.",
        depth: 20 * consts.to_metres_factor
    },
    {
        string: "Surprised to hear me here? I wouldn't be...",
        depth: 22 * consts.to_metres_factor
    },
    {
        string: "...after all, most people *are* here.",
        depth: 23 * consts.to_metres_factor
    },
    {
        string: "...",
        depth: 25 * consts.to_metres_factor
    },
    {
        string: "Nevertheless – you are welcome.",
        depth: 27 * consts.to_metres_factor
    },
    {
        string: "Though I'm sad to say you won't like it here.",
        depth: 30 * consts.to_metres_factor
    },
    {
        string: "You took the job so you could be alone.",
        depth: 35 * consts.to_metres_factor
    },
    {
        string: "But I am here with you. No solace!",
        depth: 36 * consts.to_metres_factor
    },
    {
        string: "You wanted to be somewhere else, I know.",
        depth: 37 * consts.to_metres_factor
    },
    {
        string: "But anyway, you're progressing well.",
        depth: 39 * consts.to_metres_factor
    },
    {
        string: "Over thirty metres' shaft, nothing to sneeze at.",
        depth: 40 * consts.to_metres_factor
    },
    {
        string: "<--- Here's fifty.",
        depth: 50 * consts.to_metres_factor
    },
    {
        string: "You should be proud of your perseverance.",
        depth: 52 * consts.to_metres_factor
    },
    {
        string: "I wonder how deep it should be in the end?",
        depth: 60 * consts.to_metres_factor
    },
    {
        string: "The underground is full of fun.",
        depth: 100 * consts.to_metres_factor
    },
    {
        string: "There's minerals, there's rocks and stuff.",
        depth: 110 * consts.to_metres_factor
    },
    {
        string: "Go far enough, you get magma flows and all.",
        depth: 120 * consts.to_metres_factor
    },
    {
        string: "But that's not your fun, right?",
        depth: 130 * consts.to_metres_factor
    },
    {
        string: "They're called *boreholes* for a reason.",
        depth: 140 * consts.to_metres_factor
    },
    {
        string: "(whatever the tagline may say)",
        depth: 141 * consts.to_metres_factor
    },
    {
        string: "150 metres down, how much to go?",
        depth: 150 * consts.to_metres_factor
    },
    {
        string: "How deep will be deep enough?",
        depth: 170 * consts.to_metres_factor
    },
    {
        string: "200 metres! That's an accomplishment.",
        depth: 200 * consts.to_metres_factor
    },
    {
        string: "I'm serious. I don't mean to mock you.",
        depth: 220 * consts.to_metres_factor
    },
    {
        string: "This hole is really important to people.",
        depth: 240 * consts.to_metres_factor
    },
    {
        string: "Still, maybe there's something YOU would like more?",
        depth: 260 * consts.to_metres_factor
    },
    {
        string: "Three hundred! That's really, really good.",
        depth: 300 * consts.to_metres_factor
    },
    {
        string: "You like being deep, don't you?",
        depth: 340 * consts.to_metres_factor
    },
    {
        string: 'Being "deep" means being at peace.',
        depth: 360 * consts.to_metres_factor
    },
    {
        string: "You like that, being at peace.",
        depth: 380 * consts.to_metres_factor
    },
    {
        string: "That's why you wanted to be a cosmonaut.",
        depth: 400 * consts.to_metres_factor
    },
    {
        string: "Though it's not a great job for that.",
        depth: 402 * consts.to_metres_factor
    },
    {
        string: "Remember the god-awful amount of press",
        depth: 403 * consts.to_metres_factor
    },
    {
        string: "Ltn. Gagarin got? Horrible!",
        depth: 404 * consts.to_metres_factor
    },
     {
        string: "Not a day without a camera in his face, a mic down his throat.",
        depth: 410 * consts.to_metres_factor
    },

    {
        string: "Of course, the part where he burned sucked too.",
        depth: 440 * consts.to_metres_factor
    },
    {
        string: "Not trying to be snarky, I really liked him.",
        depth: 442 * consts.to_metres_factor
    },
    {
        string: "But really, boarding one of those massive",
        depth: 450 * consts.to_metres_factor
    },
    {
        string: "contraptions composed of combustive chemicals?",
        depth: 451 * consts.to_metres_factor
    },
    {
        string: "It's not a smart guy's move.",
        depth: 460 * consts.to_metres_factor
    },
    {
        string: "(and he sure paid the price...)",
        depth: 461 * consts.to_metres_factor
    },
    {
        string: "Maybe heroes don't have to be smart, though.",
        depth: 480 * consts.to_metres_factor
    },
    {
        string: "Handsome, fearless, loyal, devoted, maybe?",
        depth: 490 * consts.to_metres_factor
    },
    {
        string: "I doubt Gagarin was fearless, though.",
        depth: 550 * consts.to_metres_factor
    },
    {
        string: "Hearing the alarms, knowing he was about",
        depth: 552 * consts.to_metres_factor
    },
    {
        string: "to be insta-cremated by a rocket failure,",
        depth: 553 * consts.to_metres_factor
    },
    {
        string: "the Lieutenant *waved* and smiled at the camera!",
        depth: 554 * consts.to_metres_factor
    },
    {
        string: "Like it was no big deal.",
        depth: 556 * consts.to_metres_factor
    },
    {
        string: "My theory? He wasn't fearless. He was scared.",
        depth: 560 * consts.to_metres_factor
    },
    {
        string: "Anyone would be, and should be.",
        depth: 561 * consts.to_metres_factor
    },
    {
        string: "But he was brave enough to face what was coming,",
        depth: 570 * consts.to_metres_factor
    },
    {
        string: "face it with a smile. You know why?",
        depth: 571 * consts.to_metres_factor
    },
    {
        string: "He must've wanted us to",
        depth: 580 * consts.to_metres_factor
    },
    {
        string: "TRY",
        depth: 595 * consts.to_metres_factor
    },
    {
        string: "AGAIN",
        depth: 597 * consts.to_metres_factor
    },
    {
        string: "OVER",
        depth: 600 * consts.to_metres_factor
    },
    {
        string: "and       OVER",
        depth: 605 * consts.to_metres_factor
    },
    {
        string: "and              OVER",
        depth: 610 * consts.to_metres_factor
    },
    {
        string: "Because! What waits us at the end was, to him...",
        depth: 620 * consts.to_metres_factor
    },
    {
        string: "...well worth burning for if that's what it takes.",
        depth: 650 * consts.to_metres_factor
    },
    {
        string: "So, how about you?",
        depth: 700 * consts.to_metres_factor
    },
    {
        string: "You could've been there and burned in his stead...",
        depth: 750 * consts.to_metres_factor
    },
    {
        string: "Would you have waved at the camera?",
        depth: 800 * consts.to_metres_factor
    },
    {
        string: "Smiled?",
        depth: 820 * consts.to_metres_factor
    },
    {
        string: "LAUGHED?",
        depth: 840 * consts.to_metres_factor,
        special_style: '#B00'
    },
    {
        string: "Thanks for stopping to read.",
        depth: 900 * consts.to_metres_factor
    },
    {
        string: "Then again, red text always gets your attention.",
        depth: 901 * consts.to_metres_factor
    },
    {
        string: "Spookytime?",
        depth: 903 * consts.to_metres_factor
    },
    {
        string: "Anyway. Whether or not you laughed, lots of others",
        depth: 920 * consts.to_metres_factor
    },
    {
        string: "certainly would have. I mean, laughed at you, seeing you",
        depth: 921 * consts.to_metres_factor
    },
    {
        string: "fry on the TV, inside that rocket death chamber of yours.",
        depth: 922 * consts.to_metres_factor
    },
    {
        string: "Don't take it personally.",
        depth: 930 * consts.to_metres_factor
    },
    {
        string: "It's how they cope.",
        depth: 932 * consts.to_metres_factor
    },
    {
        string: "They did the same to Yuri.",
        depth: 934 * consts.to_metres_factor
    },
    {
        string: "One kilometre down. Think about it.",
        depth: 1000 * consts.to_metres_factor
    },
    {
        string: "You're still at walking distance from all that hustle and",
        depth: 1002 * consts.to_metres_factor
    },
    {
        string: "bustle on the surface. Life still thrives here. At least in",
        depth: 1003 * consts.to_metres_factor
    },
    {
        string: "that boxy pile driver of yours.",
        depth: 1004 * consts.to_metres_factor
    },
    {
        string: "And you aren't even close to the Marinara trench.",
        depth: 1100 * consts.to_metres_factor
    },
    {
        string: "Err... Maradona? Mariachi?",
        depth: 1150 * consts.to_metres_factor
    },
    {
        string: "Forget I said anything.",
        depth: 1155 * consts.to_metres_factor
    },
    {
        string: "I'm sorry, you wanted deep and all you get is",
        depth: 1200 * consts.to_metres_factor
    },
    {
        string: "this hand-wavey nonsense.",
        depth: 1201 * consts.to_metres_factor
    },
    {
        string: "At least you have another direction to go. I'm stuck.",
        depth: 1210 * consts.to_metres_factor
    },
    {
        string: "No way out of here for me.",
        depth: 1211 * consts.to_metres_factor
    },
    {
        string: "Fun fact by the way.",
        depth: 1230 * consts.to_metres_factor
    },
    {
        string: "Your shaft is over 10% of the depth of the Kola borehole!",
        depth: 1231 * consts.to_metres_factor
    },
    {
        string: "(which shouldn't exist yet, please ignore the anachronism)",
        depth: 1232 * consts.to_metres_factor
    },
    {
        string: "You really shouldn't try to beat the borehole though.",
        depth: 1300 * consts.to_metres_factor
    },
    {
        string: "For one, it's still super, very, quite far.",
        depth: 1400 * consts.to_metres_factor
    },
    {
        string: "For two, for all its depth, it's just",
        depth: 1500 * consts.to_metres_factor
    },
    {
        string: "NOT",
        depth: 1501 * consts.to_metres_factor,
        special_style: '#B00'

    },
    {
        string: "DEEP",
        depth: 1502 * consts.to_metres_factor,
        special_style: '#B00'

    },
    {
        string: "ENOUGH",
        depth: 1503 * consts.to_metres_factor,
        special_style: '#B00'

    },
    {
        string: "You must go deeper.",
        depth: 1600 * consts.to_metres_factor,

    },
    {
        string: "This planet is too small for you.",
        depth: 1700 * consts.to_metres_factor,
    },
    {
        string: "Even at this depth, it constricts you.",
        depth: 1800 * consts.to_metres_factor,
    },
    {
        string: "I doubt you'll find your peace here.",
        depth: 1900 * consts.to_metres_factor,
    },
    {
        string: "Two kilometres... how long until you give up?",
        depth: 2000 * consts.to_metres_factor,
    },
    {
        string: "Funny I should mention \"up\"...",
        depth: 2100 * consts.to_metres_factor,
    },
    {
        string: "I mean that thing goes that way too.",
        depth: 2200 * consts.to_metres_factor,
    },
    {
        string: "Maybe you should give \"up\" a shot?",
        depth: 2300 * consts.to_metres_factor,
    },
    {
        string: "I know you want to travel through space.",
        depth: 2500 * consts.to_metres_factor,
    },
    {
        string: "(Think about it.)",
        depth: 2502 * consts.to_metres_factor,
    },
    {
        string: "No hole will get you to space..",
        depth: 2600 * consts.to_metres_factor,
    },
    {
        string: "Maybe some kind of a wormhole might?",
        depth: 2601 * consts.to_metres_factor,
    },
    {
        string: "You should still seek your private",
        depth: 2700 * consts.to_metres_factor,
    },
    {
        string: "depths elsewhere.",
        depth: 2701 * consts.to_metres_factor,
    },
    {
        string: "That's all I had to say.",
        depth: 3000 * consts.to_metres_factor,
    },
    {
        string: "Goodbye. I hope you find what",
        depth: 3100 * consts.to_metres_factor,
    },
    {
        string: "you haven't yet begun looking for.",
        depth: 3101 * consts.to_metres_factor,
    },
    {
        string: "Congrats. You beat the Kola borehole.",
        depth: 12270 * consts.to_metres_factor
    },
]

const space_strings = [
    {
        string: "Wow. You're airborne.",
        pos: 1,
        spacetime: 8
    },
    {
        string: "It's beautiful up here, right?",
        pos: 2,
        spacetime: 10
    },
    {
        string: "You are really, really high.",
        pos: 1,
        spacetime: 14
    },
    {
        string: "(at least by piledriver standards)",
        pos: 2,
        spacetime: 16
    },
    {
        string: "Finally, something TRULY deep.",
        pos: 1,
        spacetime: 20
    },
    {
        string: "SPACE.",
        pos: 2,
        spacetime: 24,
        special_font: "bold 84px serif"
    }
]

const endgame_strings = [
    ["You never really gave up on your dream",
     "to become a cosmonaut. Your passion has",
     "driven you to new heights...",
     "...and the vast depths of space."],

    ["People all around the world celebrate",
     "you, the first human in space. You are an",
     "undying inspiration to all piledriver",
     "operators, many of whom repeat your",
     "feat, emboldened by your success."],

    ["What you did today was not just your dream.",
     "",
     "You single-handedly started a new age of",
     "piledriver-based space exploration."],

    ["You gave us hope. You gave us the keys",
     "to the entire universe.",
     "",
     "You are a legend."],

     ["You have been playing",
      "",
      "REVOLUTION PILEDRIVER",
      "A Piledriver Story by Kalle Viiri"]
];

var visible_space_strings = [];
var space_string_index = 0;

var victory_string_index = 0;

const taglines = [
    "Shaft – can you dig it?",
    "This is not a drill.",
    "Down-to-Earth business.",
    "Some of these tunnels may be carpal.",
    "Life has its ups and downs.",
    "Excitehole, not a borehole!",
    "That's so deep.",
    "Are you out of your depth?",
    "So you like underground games.",
    "Hole lotta fun.",
    "Hammer it home.",
    "What have you dug yourself into?",
]
camera_pos = 0; //how "high" the camera is
ticks_per_sec = 60; //basic estimate
advice_timeout = 10*1000; //ten seconds before re-writing advice

function loop(newtime) {
  // Compute the delta-time against the previous time
  const dt = newtime - oldtime;
  ticks_per_sec = 1000 / dt;
  // Update the previous time
  oldtime = newtime;
  //if deep underground, advance timeout
  if(piledriver.y > 360) {
      advice_timeout = Math.max(0, advice_timeout-dt);
  }

  for (var i = 0; i < particles.length; i++) {
      particles[i].ttl -= dt;
      particles[i].x += particles[i].x_speed;
      particles[i].y += particles[i].y_speed;
  }
  particles=particles.filter((part) => part.ttl > 0);

  //SPACETIME!
  update_spacetime(dt);

  if(player.spacetime > 27 * 1000) {
    trigger_victory();
  }
  visible_space_strings.forEach((space_str) => space_str.displaytime-=dt);
  visible_space_strings =
    visible_space_strings.filter((space_str) => space_str.displaytime > 0);

  // Update
  step(dt);

  // Render
  draw();

  // Repeat
  window.requestAnimationFrame(loop);
};

// Launch
function init() {
    player.current_advice = advice_strings[0].advice;
    player.current_tagline = "A Piledriver Story by Kalle Viiri";
    window.addEventListener('keydown', this.keycheck);
    window.requestAnimationFrame(newtime => {
     oldtime = newtime;
     window.requestAnimationFrame(loop);
    });
    this.canvas.addEventListener('wheel',function(event){
        wheel(event);
        return false; 
    }, false);
}

function keycheck(evt) {
    c = evt.key;
    if (!surfaced() && (c != 't' || player.items['t']==0 || piledriver.y < -piledriver.height)) return;

    if (shop_items[c] && shop_items[c][player.items[c]].availability()) {
        if (shop_items[c][player.items[c]].cost <= player.money) {
            player.money -= shop_items[c][player.items[c]].cost;
            shop_items[c][player.items[c]].effect();
        }
    }
}


function step(dt) {

    //move piledriver
    piledriver.y += piledriver.velocity;

    if (player.victory) {
        player.victory+=dt;
        if (player.victory > graph_consts.endgame_str_ttl) {
            player.victory = 1;
            victory_string_index+=1;
        }
        piledriver.velocity -= 0.05;
        spawn_particles(
            piledriver.x + piledriver.width/2,
            piledriver.y + piledriver.height,
            ~~(Math.random()*6)+3
        );
        return;
    }

    //soaring through air at high speed? PARTICLES :D
    if(piledriver.y < -piledriver.height && Math.abs(piledriver.velocity) >= 10) {
        spawn_particles(
            piledriver.x,
            piledriver.y + (piledriver.velocity>0?0:piledriver.height),
            Math.random()*2
        );
        spawn_particles(
            piledriver.x+piledriver.width,
            piledriver.y + (piledriver.velocity>0?0:piledriver.height),
            Math.random()*2
        );
    }

    //chasm bottom banged
    if (piledriver.y + piledriver.height > chasm.depth) {
        if (piledriver.velocity > chasm.hardness) {
            let old_depth = chasm.depth;
            chasm.depth = piledriver.y + piledriver.height;
            //recoil engine check
            if(player.items['s'] == 1) {
                piledriver.recoil_energy +=
                  piledriver.velocity
                    * (1-consts.booster_penetrations[player.items['b']])
                    * consts.recoil_preservations[player.items['r']];
            }
            piledriver.velocity *= consts.booster_penetrations[player.items['b']];

            award_depth_money(chasm.depth - old_depth);
            piledriver.mineral_bay += (chasm.depth - old_depth) * consts.money_per_depth;
            piledriver.mineral_bay =
                Math.min(piledriver.mineral_bay, consts.mineral_bay_cap[player.items['m']]);

            spawn_particles(piledriver.x, piledriver.y+piledriver.height,
                ~~(Math.random*6) + 3);
            spawn_particles(piledriver.x+piledriver.width, piledriver.y+piledriver.height,
                ~~(Math.random*6) + 3);
        }
        else {
            //Recoil engine check
            if (piledriver.recoil_energy > 0) {
                piledriver.velocity = -piledriver.recoil_energy;
                player.recoil_energy = 0;
            }
            else {
                piledriver.velocity = 0;
            }

        }
    }
    else {
        //no recoil energy if not at the bottom
        piledriver.recoil_energy = 0;
        //frictionize (not a word) piledriver
        if(piledriver.y >= -piledriver.height) {
            piledriver.velocity *= consts.friction_fraction[player.items['f']];
        }
        else {
            //tiny air resistance instead
            piledriver.velocity *= 0.9997;
        }
    }
    //no going past the bottom
    piledriver.y = Math.min(piledriver.y, chasm.depth - piledriver.height);

    //no going past the top unless untethered
    if (piledriver.y < -piledriver.height && player.items['t'] != 1) {
        piledriver.y = -piledriver.height;
        piledriver.velocity = 0;
    }

    //stop very slow velocities
    if (Math.abs(piledriver.velocity) < 0.01) {
        piledriver.velocity = 0;
    }

    //update advice
    if (advice_timeout <= 0) {
        advices = advice_strings.filter(s => s.availability());
        player.current_advice = advices[~~(Math.random()*advices.length)].advice;
        player.current_tagline = taglines[~~(Math.random()*taglines.length)];
        advice_timeout = Math.random() * 20000 + 10000;
    }

    //award mineral bay money
    if(surfaced()) {
        if(piledriver.mineral_bay >= consts.mineral_bay_cap[player.items['m']]/20) {
            player.money += consts.mineral_bay_cap[player.items['m']]/20;
            piledriver.mineral_bay -= consts.mineral_bay_cap[player.items['m']]/20;
        }
        else {
            player.money += piledriver.mineral_bay;
            piledriver.mineral_bay = 0;
        }
    }

    //check gravity assistors
    if((piledriver.last_acceleration > 0
        && piledriver.y + piledriver.height < chasm.depth)
        || piledriver.y < -piledriver.height) {
        piledriver.velocity += consts.gravity_assist[player.items['g']]
            * (piledriver.velocity < 0 ? 0.33 : 1);
    }
}

function award_depth_money(increase) {
    player.money += increase * consts.money_per_depth;
}

function wheel(event) {
    deltaY = event.deltaY;
    if(piledriver.y < -piledriver.height) {
        piledriver.last_acceleration = deltaY * 0.01;
        return;
    } //nice try but yes, do amend the last_acceleration direction
    if(deltaY > 0 && piledriver.recoil_energy > 0) return; //nice try

    piledriver.last_acceleration = deltaY * 0.01 * (
        deltaY > 0 ? 1 : consts.ascension[player.items['c']]
    );
    piledriver.velocity += piledriver.last_acceleration;
}

function surfaced() {
    return piledriver.y <= 0 && piledriver.y >= -64
}

function spawn_particles(x, y, num) {
    for (var i = 0; i < num; i++) {
        particles.push({
            x: x + Math.random()*8 -4,
            y: y + Math.random()*8 -4,
            x_speed: Math.random() - 0.5,
            y_speed: Math.random() - 0.5,
            ttl: Math.random() * 250 + 500
        })
    }
}

function trigger_victory() {
    if (player.victory) return;
    player.victory = 1;
    wheel = function(event){}; //disable mouse wheel
    updateCameraPosition = function() {}; //disable camera position update
    piledriver.velocity = 0; //stop down for kinematic effect
}

function update_spacetime(dt) {
    if (piledriver.y < -200*consts.to_metres_factor && piledriver.velocity < 0) {
        player.spacetime += dt;
        if (space_string_index < space_strings.length
         && space_strings[space_string_index].spacetime*1000 < player.spacetime) {
            visible_space_strings.push(Object.assign(space_strings[space_string_index],
            {
                displaytime: graph_consts.space_string_ttl
            }));
            space_string_index+=1;
        }
    }
    else {
        player.spacetime = 0;
        space_string_index = 0;
    }
}

//Draw functions
function draw() {
    updateCameraPosition();
    let canvas = document.getElementById('canvas');
    var ctx = canvas.getContext('2d');
    ctx.strokeStyle='#000';
    const light = 255 - 
        Math.max(
            200*Math.min(piledriver.y / (4000*consts.to_metres_factor), 1),
            230*Math.min(-piledriver.y / (1000*consts.to_metres_factor),1)
        );
    
    ctx.fillStyle = `rgb(${light}, ${light}, ${light})`;

    ctx.fillRect(0, 0, canvas.width - consts.status_screen_width, canvas.height);
    ctx.fillStyle = '#FFF';
    ctx.fillRect(canvas.width - consts.status_screen_width, 0,
        consts.status_screen_width, canvas.height);

    drawStars(ctx);
    drawGround(ctx, canvas);
    drawLogo(ctx);
    drawChasm(ctx);
    drawDriver(ctx);
    drawUndergroundStrings(ctx);
    drawParticles(ctx);

    drawSpaceStrings(ctx);
    drawEndgameString(ctx, canvas);
    drawPretentiousEndgameString(ctx, canvas);
    //drawRocks(ctx);

    drawStatusScreen(ctx, canvas);


}

function updateCameraPosition() {
    if(camera_pos < piledriver.y - 200) {
        camera_pos = piledriver.y - 200;
    }
    else if (camera_pos > piledriver.y) {
        camera_pos = piledriver.y;
    }
}
    

function getCameraPosition() {
    return consts.ground_offset - camera_pos;
}

function drawLogo(ctx) {
    ctx.save();
    ctx.translate(0, getCameraPosition());
    ctx.fillStyle='#000';
    ctx.font = "64px serif";
    ctx.fillText("REVOLUTION     PILEDRIVER v1.0", 18, -300);
    ctx.font = "24px serif";
    ctx.fillText(player.current_tagline, 24, -260);
    ctx.restore();
}

function drawGround(ctx, canvas) {
    ctx.save();
    ctx.translate(0, getCameraPosition());
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(piledriver.x - 10, 0);
    ctx.moveTo(piledriver.x + piledriver.width + 10, 0);
    ctx.lineTo(canvas.width - consts.status_screen_width, 0);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
}

//our hero
function drawDriver(ctx) {
    ctx.save();
    ctx.fillStyle='#FFF';
    ctx.strokeStyle='#000';
    ctx.translate(piledriver.x, getCameraPosition());

    //cable
    if(piledriver.y >= -128) {
    ctx.beginPath();
        ctx.moveTo(piledriver.width/2-2, piledriver.y);
        ctx.lineWidth = 1;
        ctx.lineTo(piledriver.width/2-2, -128);
        ctx.lineTo(piledriver.width/2+2, -128);
        ctx.lineTo(piledriver.width/2+2, piledriver.y);
        ctx.closePath();
        ctx.stroke();
    }

    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.fillRect(0, piledriver.y, piledriver.width, piledriver.height);
    ctx.strokeRect(0, piledriver.y, piledriver.width, piledriver.height);
    ctx.closePath();
    

    //antifric-bearings
    if (player.items['f'] != 0) {
        ctx.beginPath();
        ctx.fillStyle = graph_consts.antifric[player.items['f']];
        ctx.moveTo(piledriver.width/3, piledriver.y);
        ctx.lineTo(piledriver.width - piledriver.width/3, piledriver.y);
        ctx.lineTo(piledriver.width - piledriver.width/3 - 3, piledriver.y - 8);
        ctx.lineTo(piledriver.width/3 + 3, piledriver.y - 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    //climbers
    if (player.items['c'] != 0) {
        ctx.beginPath();
        ctx.fillStyle = graph_consts.climbers[player.items['c']];
        ctx.moveTo(0, piledriver.y + piledriver.height-20);
        ctx.quadraticCurveTo(
            -8, piledriver.y + piledriver.height -18,
            -8, piledriver.y + piledriver.height + 8);
        ctx.quadraticCurveTo(
            -4, piledriver.y + piledriver.height -8,
             0, piledriver.y + piledriver.height);
        ctx.closePath()
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = graph_consts.climbers[player.items['c']];
        ctx.moveTo(piledriver.width, piledriver.y + piledriver.height-20);
        ctx.quadraticCurveTo(
            piledriver.width+8, piledriver.y + piledriver.height -18,
            piledriver.width+8, piledriver.y + piledriver.height + 8);
        ctx.quadraticCurveTo(
            piledriver.width+4, piledriver.y + piledriver.height -8,
            piledriver.width, piledriver.y + piledriver.height);
        ctx.closePath()
        ctx.fill();
        ctx.stroke();
    }

    //grav_assist arrows
    if (player.items['g'] != 0) {
        ctx.beginPath();
        ctx.fillStyle='#000';
        ctx.strokeStyle='#000';
        ctx.lineWidth = 1;
        ctx.moveTo(8, piledriver.y + 4);
        ctx.lineTo(4, piledriver.y + 8);
        ctx.lineTo(12, piledriver.y + 8);
        ctx.closePath();
        if(piledriver.last_acceleration < 0) {
            ctx.fillStyle = '#000';
        }
        else {
            ctx.fillStyle = '#FFF';
        }
        ctx.fill();
        ctx.stroke();
        ctx.beginPath(); //hack that somehow makes the triangle prettier. No idea.
        ctx.closePath();

        for (var i = 0; i < player.items['g']; i++) {
            ctx.beginPath();
            ctx.moveTo(4, piledriver.y + 12 + i * 6);
            ctx.lineTo(12, piledriver.y + 12 + i * 6);
            ctx.lineTo(8, piledriver.y + 16 + i * 6);
            ctx.closePath();
            if(piledriver.last_acceleration > 0) {
                ctx.fillStyle = '#000';
            }
            else {
                ctx.fillStyle = '#FFF';
            }
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.closePath();
        }
    }

    //mineral bay
    if (player.items['m'] != 0) {
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.strokeRect(
            piledriver.width-4-graph_consts.mineral_bay_widths[player.items['m']],
            piledriver.y+4, graph_consts.mineral_bay_widths[player.items['m']], 40
        );
        ctx.closePath();
        ctx.beginPath();
        ctx.fillStyle='#000';
        let current_fill = piledriver.mineral_bay / consts.mineral_bay_cap[player.items['m']]
        let rect_size = 40*current_fill;
        ctx.fillRect(piledriver.width-4-graph_consts.mineral_bay_widths[player.items['m']],
            piledriver.y+4+40-rect_size,
            graph_consts.mineral_bay_widths[player.items['m']],
            rect_size
        );
        ctx.closePath();
    }
    //spiky boi
    if (player.items['b'] != 0) {
        ctx.beginPath();
        ctx.fillStyle=graph_consts.booster_fill_styles[player.items['b']];
        ctx.moveTo(0, piledriver.y + piledriver.height);
        ctx.lineTo(piledriver.width/2, piledriver.y + piledriver.height+8);
        ctx.lineTo(piledriver.width, piledriver.y + piledriver.height);
        ctx.quadraticCurveTo(piledriver.width/2, piledriver.y +piledriver.height-24, 0, piledriver.y +piledriver.height);
        ctx.stroke();
        ctx.fill();
        ctx.closePath();
    }
    ctx.restore();
}

function drawChasm(ctx) {
    ctx.save();
    ctx.translate(0, getCameraPosition());
    ctx.beginPath();
    ctx.moveTo(piledriver.x - 10, 0);
    ctx.lineTo(piledriver.x - 10, chasm.depth-8);
    ctx.quadraticCurveTo(piledriver.x + piledriver.width/2, chasm.depth+10,
                         piledriver.x + piledriver.width + 10, chasm.depth-8);
    ctx.lineTo(piledriver.x + piledriver.width + 10, 0);
    ctx.stroke();
    ctx.restore();
}

function drawParticles(ctx) {
    ctx.save();
    for (var i = 0; i < particles.length; i++) {
        let opacity = Math.min(1, particles[i].ttl / 300);
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity}`;
        ctx.strokeStyle = `rgba(0, 0, 0, ${opacity}`;
        ctx.beginPath();
        ctx.arc(particles[i].x, particles[i].y + getCameraPosition(), 3, 0, 2*Math.PI);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.closePath();
    }
    ctx.restore();
}


function drawStatusScreen(ctx, canvas) {
    ctx.save();
    ctx.translate(canvas.width - consts.status_screen_width, 0);

    ctx.rect(0, 0, consts.status_screen_width, canvas.height);
    ctx.stroke();

    ctx.fillStyle='#000';
    ctx.font = "24px serif";
    ctx.textAlign="end";
    let depth_string = !player.victory
        ?Math.abs((piledriver.y+piledriver.height/2) / consts.to_metres_factor).toFixed(1) + "m " +
        (piledriver.y < 0 ? "above " : "under") + "ground"
        :"You are deeper than ever before."
    ctx.fillText(depth_string, consts.status_screen_width-20, 1*32);

    let speed_string = !player.victory 
        ?"Speed: " +Math.abs(piledriver.velocity*ticks_per_sec / consts.to_metres_factor).toFixed(1) + "m/s"
        :"Speed: Enough.";
    ctx.fillText(speed_string, consts.status_screen_width-20, 2*32);

    let chasm_string = !player.victory
        ?`Your shaft is ${(chasm.depth / consts.to_metres_factor).toFixed(1)}m deep.`
        :"Your shaft is not deep.";
    ctx.fillText(chasm_string, consts.status_screen_width-20, 3*32);

    let rouble_string = !player.victory
        ?`You have ${Math.floor(player.money)} ₽.`
        :"You have no need for money.";
    ctx.fillText(rouble_string, consts.status_screen_width-20, 5*32);

    drawAdviceScreen(ctx, canvas, 7*32);
    drawShopScreen(ctx, canvas, 400);

    ctx.restore();

}



function drawAdviceScreen(ctx, canvas, y_top) {
    ctx.save();
    ctx.translate(0, y_top);
    ctx.moveTo(0,-24);
    ctx.lineTo(consts.status_screen_width, -24);
    ctx.stroke();

    ctx.textAlign="center";
    ctx.font = "bold 24px serif";
    ctx.fillStyle = piledriver.y >= 3500 * consts.to_metres_factor ? '#D00':'#000';
    ctx.fillText(piledriver.y >= 3500 * consts.to_metres_factor
        ? "Sadvice"
        : "Professional Advice"
        ,consts.status_screen_width/2, 0);

    ctx.font = "16px monospace";
    ctx.textAlign="center";
    let advice_string = ["* You need to be surfaced to *",
                         "*  shop and receive advice.  *"];
    if (surfaced()) {
        advice_string = player.current_advice;
    }
    if (player.victory) {
        advice_string = ["Wow. You actually did it.",
                         "You made us proud. ~~M&D"]
    }
    if (piledriver.y >= 3500 * consts.to_metres_factor) {
        advice_string = ["what you want is not here",
                         "",
                         "NO DEPTH IS ENOUGH",
                         "",
                         ":D"]
    }
    for (var i = 0; i < advice_string.length; i++) {
        ctx.fillText(advice_string[i], consts.status_screen_width/2, 48+16*i);
    }
    ctx.restore();
}



function drawShopScreen(ctx, canvas, y_top) {
    ctx.save();
    ctx.translate(0, y_top);
    ctx.moveTo(0, -24);
    ctx.lineTo(consts.status_screen_width, -24);
    ctx.stroke();

    ctx.textAlign="center";
    ctx.font = "bold 24px serif";
    ctx.fillText("Shapft (Shaft Shop)", consts.status_screen_width/2, 0);


    ctx.textAlign="left";
    ctx.font = "12px monospace"
    y_pos = 48;
    for (const hotkey in shop_items) {
        if (player.items[hotkey] == shop_items[hotkey].length) {
            ctx.fillStyle = '#999';
            ctx.fillText(`MAXED – ${shop_items[hotkey][shop_items[hotkey].length-1].desc}`, 16, y_pos);
            y_pos += 32;
        }
        else if (shop_items[hotkey][player.items[hotkey]].availability()) {
            if (surfaced() || 
              (hotkey == 't' && player.items[hotkey] != 0 && piledriver.y > -piledriver.height)) {
                ctx.fillStyle = '#000';
            }
            else {
                ctx.fillStyle = '#999';
            }
            item = shop_items[hotkey][player.items[hotkey]];
            ctx.fillText(`[${hotkey}] – ${item.cost} ₽ – ${item.desc}`, 16, y_pos);
            y_pos += 32;
        }
    }
    ctx.restore();
}

function drawUndergroundStrings(ctx) {
    stringlist = underground_strings.filter(
        (ug_string) => Math.abs(-ug_string.depth-getCameraPosition()) < 1200);

    ctx.save();
    ctx.font = "24px serif";
    for (var i = 0; i < stringlist.length; i++) {
        ug_string = stringlist[i];
        if(ug_string.special_style) {
            ctx.fillStyle=ug_string.special_style;
        }
        else {
            ctx.fillStyle='#000';
        }
        ctx.fillText(ug_string.string, 600, getCameraPosition() + ug_string.depth)
    }
    ctx.restore();
}

function drawSpaceStrings(ctx) {
    ctx.save();
    for (let i = 0; i < visible_space_strings.length; i++){
        let space_str = visible_space_strings[i];
        ctx.font = space_str.special_font || "64px serif";
        let alpha = Math.min(
            (graph_consts.space_string_ttl - space_str.displaytime ) * 0.0012, //fade in
            space_str.displaytime * 0.0006, //fade out
            1 //max alpha is 1
        );
        ctx.fillStyle = `rgba(230, 230, 230, ${alpha})`;
        ctx.fillText(space_str.string, 100, 64 * space_str.pos);
    }
    ctx.restore();
}

function drawStars(ctx) {
    if (piledriver.y > -100) return;

    ctx.save();
    ctx.fillStyle='#FFF';
    for(var i = 0; i < stars.length; i++) {
        ctx.beginPath();
        ctx.arc(
            stars[i].x, stars[i].y+(3*(-piledriver.y/(100*consts.to_metres_factor))),
            stars[i].r,0,2*Math.PI);
        ctx.closePath();
        ctx.fill();
    }
    ctx.restore();
}

function drawEndgameString(ctx, canvas) {
    ctx.save()
    if (player.victory && victory_string_index < endgame_strings.length) {
        ctx.font='48px serif';
        ctx.lineWidth=1;
        for(let i = 0; i < endgame_strings[victory_string_index].length; i++ ) {
            let alpha = Math.min(
                player.victory * 0.0012 + -i*0.40 - 0.01,
                (graph_consts.endgame_str_ttl - player.victory) * 0.06 + -i * 0.44,
                1
            );
            ctx.fillStyle=`rgba(230, 230, 230, ${alpha})`;
            ctx.textAlign='center';
            ctx.fillText(
                endgame_strings[victory_string_index][i],
                (canvas.width - consts.status_screen_width)/2,
                i * 128 + 128
            );
        }
    }
    ctx.restore();
}


function drawPretentiousEndgameString(ctx, canvas) {
    if (!player.victory) return;
    ctx.save();
    ctx.fillStyle='#FFF';
    ctx.font="italic 96px serif"
    ctx.textAlign="center";
    ctx.translate(0, 0);
    ctx.fillText(
        "fin",
        (canvas.width - consts.status_screen_width)/2,
        Math.min(-400 + (3*(-piledriver.y/(100*consts.to_metres_factor))),
            canvas.height/2));
    ctx.restore();
}