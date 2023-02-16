class Game {
    constructor(user) {
        // game current vars
        this.allHeroPower = 0;
        this.bonusChance = 1; // default value can be lifted in percents

        // start game
        this.user = user;
        this.updateUser();
        this.initGameCanvas();
        this.initHeroes();

        // events
        document.querySelector('.top .body .game-canvas').addEventListener('click', function () {
            window.game.hitEnemy();
        });

        // every second tick
        setInterval(function () {
            window.game.tick();
        }, 1000);
    }

    initGameCanvas() {
        let enemy_type = 'enemy';
        if (this.user.sub_level >= 10) {
            enemy_type = 'boss';
        }
        this.spawnEnemy(enemy_type);
    }

    /**
     * Add all heroes to menu and calculate all power
     */
    initHeroes() {
        this.allHeroPower = 0;
        let m_items = document.querySelectorAll('.top .body .char-menu .hero-item:not(.template)');
        for (const elem of m_items) {
            elem.remove();
        }
        // init borat_swim
        this.createHeroFromTemplate(heroList.kitty_click);
        // init borat_swim
        this.createHeroFromTemplate(heroList.borat_swim);
        // init lizard_trident
        this.createHeroFromTemplate(heroList.lizard_trident);
        // init twderp_blurp
        this.createHeroFromTemplate(heroList.twderp_blurp);
        // init scary_tel
        this.createHeroFromTemplate(heroList.scary_tel);
        // user stats
        this.updateUser();
    }

    createHeroFromTemplate(hero) {
        let add_hero = document.querySelector('.top .body .char-menu .hero-item.template').cloneNode(true);
        add_hero.classList.remove('template');
        add_hero.querySelector('.icon img').src = hero.img;
        add_hero.querySelector('.info').innerHTML = hero.name + ' + ' + hero.power + ' power! <br> All power: ' + (hero.power * this.user.heroes[hero.key].count) + ', count: x' + this.user.heroes[hero.key].count + '<div class="effects"></div>';
        add_hero.querySelector('.action .btnBuy .price').innerHTML = hero.price * (this.user.heroes[hero.key].count + 1);
        add_hero.querySelector('.action .btnBuy').addEventListener('click', function () {
            window.game.buyHero(hero);
        });
        document.querySelector('.top .body .char-menu').append(add_hero);
        // effects
        for (let key in hero.effects) {
            let ef_btn = this.createEffectBtn(hero, hero.effects[key]);
            add_hero.querySelector('.info .effects').append(ef_btn);
        }
        // all power
        if (hero.key !== 'kitty_click') {
            this.allHeroPower += hero.power * this.user.heroes[hero.key].count;
        }
    }

    createEffectBtn(hero, effect) {
        let is_active = this.user.heroes[hero.key].effects[effect.key].active;
        let ef_btn = document.createElement('img');
        ef_btn.classList.add('effect-btn');
        ef_btn.src = effect.img;
        ef_btn.title = effect.price + ' USD -> ' + effect.name + ': ' + effect.info;
        if (is_active) {
            ef_btn.classList.add('active');
        } else {
            ef_btn.addEventListener('click', function () {
                window.game.buyEffect(hero.key, effect.key);
            });
        }
        return ef_btn;
    }

    /**
     * Buy effect only if we have atleast 1 hero
     * @param hero_key
     * @param effect_key
     */
    buyEffect(hero_key, effect_key) {
        if (this.user.heroes[hero_key].count > 0 && this.user.usd >= this.user.heroes[hero_key].effects[effect_key].price && this.user.heroes[hero_key].effects[effect_key].active === false) {
            this.user.heroes[hero_key].effects[effect_key].active = true;
            this.user.usd -= parseFloat(this.user.heroes[hero_key].effects[effect_key].price.toFixed(2));
            this.updateUser();
            this.initHeroes();
            saveThisUser(this.user);
        }
    }

    buyHero(hero) {
        let price = hero.price * (this.user.heroes[hero.key].count + 1);
        if (this.user.usd >= price) {
            this.user.heroes[hero.key].count++;
            this.user.usd -= parseFloat(price.toFixed(2));
            this.updateUser();
            this.initHeroes();
            saveThisUser(this.user);
        }
    }

    tick() {
        this.hitEnemy('tick');
    }

    /**
     * Spawn particular enemy
     * @param type enemy|boss|bonus
     */
    spawnEnemy(type = 'enemy') {
        let enemy = null;
        let hp = 10;
        if (type === 'enemy') {
            enemy = randomProp(enemyList);
            hp = this.user.level * hp;
        } else if (type === 'boss') {
            enemy = randomProp(bossList);
            hp = this.user.level * hp * 10;
        } else if (type === 'bonus') {
            enemy = randomProp(bonusList);
            hp = this.user.level * hp;
        } else {
            enemy = randomProp(enemyList);
        }
        // random enemy
        currentEnemy.type = type;
        currentEnemy.info = enemy;
        currentEnemy.max_hp = hp;
        currentEnemy.hp = hp;
        currentEnemy.usd = this.generateRandomUsdLoot(type);
        // set to canvas
        let levelText = '[' + this.user.sub_level + '/10 - <b>' + this.user.level + '</b>] ';
        document.querySelector('.top .body .game-canvas .enemy-name').innerHTML = levelText + currentEnemy.info.name;
        document.querySelector('.top .body .game-canvas .enemy-img img').src = currentEnemy.info.img;
        document.querySelector('.top .body .game-canvas .enemy-hp').style.width = '100%';
    }

    /**
     * Hit enemy by click or tick
     * @param type click|tick
     */
    hitEnemy(type = 'click') {
        if (type === 'click') {
            currentEnemy.hp -= this.calcCurrentClickPower();
        } else {
            currentEnemy.hp -= this.allHeroPower;
        }
        if (type === 'tick' && this.allHeroPower <= 0) {
            return;
        }
        let percent = Math.floor(currentEnemy.hp / (currentEnemy.max_hp / 100));
        document.querySelector('.top .body .game-canvas .enemy-hp').style.width = percent + '%';
        let img_el = document.querySelector('.top .body .game-canvas .enemy-img img');
        img_el.style.animation = 'none';
        img_el.offsetHeight; /* trigger reflow */
        img_el.style.animation = null;
        img_el.classList.remove('click');
        img_el.classList.add('click');
        if (currentEnemy.hp <= 0) {
            this.killEnemy();
            this.updateUser();
        }
        // money for click
        if (type === 'click') {
            this.user.usd += this.calcCurrentClickPower() * 0.1;
        }
        this.updateUser();
    }

    updateUser() {
        document.querySelector('.top .head .user-info .name').innerHTML = this.user.name;
        document.querySelector('.top .head .user-info .usd').innerHTML = parseFloat(this.user.usd).toFixed(2);
        document.querySelector('.top .head .user-info .all-power').innerHTML = this.allHeroPower;
        document.querySelector('.top .head .user-info .click-power').innerHTML = this.calcCurrentClickPower().toFixed(2);
    }

    /**
     * When enemy dead add usd and counter
     */
    killEnemy() {
        // if boss killed
        if (currentEnemy.type === 'boss') {
            this.user.sub_level = 0;
            this.user.level++;
        }
        // money, stats, spawn enemy
        this.user.usd += parseFloat(currentEnemy.usd);
        this.user.kill_count++;
        // level count
        this.user.sub_level++;
        if (this.user.sub_level >= 10) {
            this.spawnEnemy('boss');
        } else {
            // calculate bonus enemy
            let bonus_rand = getRandomArbitrary(0, 100);
            if (bonus_rand <= this.calcBonusChance()) {
                this.spawnEnemy('bonus');
            } else {
                this.spawnEnemy('enemy');
            }
        }
        // save user progress
        saveThisUser(this.user);
    }

    /**
     * Calculate click power depends on Kitty Click hero and other effects
     * @returns {number}
     */
    calcCurrentClickPower() {
        let kitty_power = heroList.kitty_click.power * this.user.heroes.kitty_click.count;
        let power = parseFloat((1 + (this.allHeroPower * 0.01) + kitty_power).toFixed(1));
        // effects
        if (this.user.heroes.kitty_click.effects.yummy_snack.active) {
            power = power + (power * this.user.heroes.kitty_click.effects.yummy_snack.amount);
        }
        return power;
    }

    /**
     * Calculate bonus enemy chance
     * @returns {number}
     */
    calcBonusChance() {
        return this.bonusChance;
    }

    generateRandomUsdLoot(type = 'enemy') {
        if (type === 'enemy') {
            return (getRandomArbitrary(0.4, 0.5) * this.user.level).toFixed(1);
        }
        if (type === 'boss') {
            return ((getRandomArbitrary(0.4, 0.5) * this.user.level) * 10).toFixed(1);
        }
        if (type === 'bonus') {
            return ((getRandomArbitrary(0.4, 0.5) * this.user.level) * 100).toFixed(1);
        }
    }
}

let currentEnemy = {
    type: 'enemy', // enemy|boss|bonus
    usd: 0,
    hp: 0,
    info: {},
};

let enemyList = {
    bydlonavt: {
        img: 'assets/img/enemy/bydlonavt.png',
        name: 'Bydlonavt',
    },
    terror_pepe: {
        img: 'assets/img/enemy/terror_pepe.png',
        name: 'Terror Pepe',
    },
    anime_bydlo: {
        img: 'assets/img/enemy/anime_bydlo.png',
        name: 'Anime Tyan Bydlo',
    },
    hardbass_man: {
        img: 'assets/img/enemy/hardbass_man.webp',
        name: 'Hardbass Pivas',
    },
    broken_cat: {
        img: 'assets/img/enemy/broken_cat.png',
        name: 'Broken Cat',
    },
    primitive_sponge: {
        img: 'assets/img/enemy/primitive_sponge.png',
        name: 'Primitive Sponge',
    },
    coba_dragon_lol: {
        img: 'assets/img/enemy/coba_dragon_lol.png',
        name: 'Kanna The Loli Dragon',
    },
    spongebob_mocking: {
        img: 'assets/img/enemy/spongebob_mocking.png',
        name: 'Spongebob Mocking',
    },
    bob_celestia: {
        img: 'assets/img/enemy/bob_celestia.png',
        name: 'Bob Celestia',
    },
    the_head: {
        img: 'assets/img/enemy/the_head.png',
        name: 'The Head',
    },
    mad_dog: {
        img: 'assets/img/enemy/mad_dog.png',
        name: 'Mad Dog',
    },
    princess_head: {
        img: 'assets/img/enemy/princess_head.gif',
        name: 'The Princess Head',
    },
    orange_head: {
        img: 'assets/img/enemy/orange_head.gif',
        name: 'The Orange',
    },
};

let bossList = {
    cadance_muscle: {
        img: 'assets/img/boss/cadance_muscle.png',
        name: 'Cadance Femdom Pony',
    },
    fluttershy_boss: {
        img: 'assets/img/boss/fluttershy_boss.webp',
        name: 'Fluttershy Boss Pony',
    },
    sandy_build: {
        img: 'assets/img/boss/sandy_build.png',
        name: 'Sandy Bouncer',
    },
    pepe_strike: {
        img: 'assets/img/boss/pepe_strike.png',
        name: 'Pepe Punch',
    },
    thanos_froggo: {
        img: 'assets/img/boss/thanos_froggo.webp',
        name: 'Thanos Froggo',
    },
};

let bonusList = {
    golden_crap: {
        img: 'assets/img/bonus/golden_crap.png',
        name: 'Golden crap',
    },
};

let heroList = {
    kitty_click: {
        key: 'kitty_click',
        index: 1,
        img: 'assets/img/hero/kitty_click.gif',
        name: 'The Click Kitty',
        power: 1,
        count: 0,
        price: 5,
        effects: {
            yummy_snack: {
                key: 'yummy_snack',
                name: 'Yummy snack',
                info: '+50% to click power',
                type: 'click_power',
                amount: 0.5,
                img: 'assets/img/effects/yummy_snack.png',
                price: 25,
                active: false,
            }
        }
    },
    borat_swim: {
        key: 'borat_swim',
        index: 2,
        img: 'assets/img/hero/borat_swim.webp',
        name: 'Borat the swimer',
        power: 3,
        count: 0,
        price: 20,
        effects: {},
    },
    lizard_trident: {
        key: 'lizard_trident',
        index: 3,
        img: 'assets/img/hero/lizard_trident.webp',
        name: 'The stone Lizard',
        power: 10,
        count: 0,
        price: 100,
        effects: {},
    },
    twderp_blurp: {
        key: 'twderp_blurp',
        index: 4,
        img: 'assets/img/hero/twderp_blurp.webp',
        name: 'The Dumb Twilight',
        power: 50,
        count: 0,
        price: 1000,
        effects: {},
    },
    scary_tel: {
        key: 'scary_tel',
        index: 5,
        img: 'assets/img/hero/scary_tel.png',
        name: 'Funny Scream',
        power: 250,
        count: 0,
        price: 10000,
        effects: {},
    },
};

