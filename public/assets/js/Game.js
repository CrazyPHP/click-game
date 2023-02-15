class Game {
    constructor(user) {
        // game current vars
        this.allHeroPower = 0;

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
        let power_multi = this.user.heroes[hero.key].count === 0 ? 1 : this.user.heroes[hero.key].count;
        add_hero.querySelector('.info').innerHTML = hero.name + ', power: ' + (hero.power * power_multi) + ' [' + this.user.heroes[hero.key].count + ']';
        add_hero.querySelector('.action .btnBuy .price').innerHTML = hero.price * (this.user.heroes[hero.key].count + 1);
        add_hero.querySelector('.action .btnBuy').addEventListener('click', function () {
            window.game.buyHero(hero);
        });
        document.querySelector('.top .body .char-menu').append(add_hero);
        // all power
        if (hero.key !== 'kitty_click') {
            this.allHeroPower += hero.power * this.user.heroes[hero.key].count;
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
        document.querySelector('.top .head .user-info .click-power').innerHTML = this.calcCurrentClickPower().toString();
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
            this.spawnEnemy();
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
        return parseFloat((1 + (this.allHeroPower * 0.01) + kitty_power).toFixed(1));
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
};

let bonusList = {};

let heroList = {
    kitty_click: {
        key: 'kitty_click',
        index: 1,
        img: 'assets/img/hero/kitty_click.gif',
        name: 'The Click Kitty',
        power: 1,
        count: 0,
        price: 5,
    },
    borat_swim: {
        key: 'borat_swim',
        index: 2,
        img: 'assets/img/hero/borat_swim.webp',
        name: 'Borat the swimer',
        power: 3,
        count: 0,
        price: 20,
    },
    lizard_trident: {
        key: 'lizard_trident',
        index: 3,
        img: 'assets/img/hero/lizard_trident.webp',
        name: 'The stone Lizard',
        power: 10,
        count: 0,
        price: 100,
    },
    twderp_blurp: {
        key: 'twderp_blurp',
        index: 4,
        img: 'assets/img/hero/twderp_blurp.webp',
        name: 'The Dumb Twilight',
        power: 50,
        count: 0,
        price: 1000,
    },
    scary_tel: {
        key: 'scary_tel',
        index: 5,
        img: 'assets/img/hero/scary_tel.webp',
        name: 'Funny Scream',
        power: 250,
        count: 0,
        price: 10000,
    },
};

