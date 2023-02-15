let sPrefix = 'bydlo_clicker_';

/**
 * Get user from localStorage
 * @returns array|null|string
 */
function getCurrentUser() {
    let user = window.localStorage.getItem(sPrefix + 'user');
    try {
        user = JSON.parse(user);
    } catch (e) {

    }
    if(user === null){
        user = {
            name: 'Jhon Doe', // just name
            usd: 0.00, // usd
            click_count: 0, // click on main scene
            heroes: heroList, // list of heroes states
            kill_count: 0, // enemy kill count
            level: 1,
            sub_level: 1, // 10 sub levels in 1 level
        };
        saveThisUser(user);
    }
    return user;
}

/**
 * Save user to localStorage
 * @param user
 */
function saveThisUser(user) {
    window.localStorage.setItem(sPrefix + 'user', JSON.stringify(user));
}

/**
 * Random element from assoc array
 * @param object
 * @returns {*}
 */
function randomProp(object) {
    let keys = Object.keys(object);
    return object[keys[Math.floor(keys.length * Math.random())]];
}

function getRandomArbitrary(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
}