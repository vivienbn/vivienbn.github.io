export function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = "expires=" + date.toUTCString();
    const stringValue = typeof value === "string" ? value : JSON.stringify(value);
    document.cookie = `${name}=${stringValue}; ${expires}; path=/`;
}

export function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split("; ");
    for (let cookie of cookies) {
        if (cookie.startsWith(nameEQ)) {
            return cookie.substring(nameEQ.length);
        }
    }
    return null; 
}

export function getOrCreateCookie(name, defaultValue, days) {
    let value = getCookie(name);
    if (!value) {
        setCookie(name, defaultValue, days);
        value = defaultValue;
    } else {
        try {
            value = JSON.parse(value);
        } catch (e) {
            console.log(e.message);
        }
    }
    return value;
}