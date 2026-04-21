import AsyncStorage from "@react-native-async-storage/async-storage";


export const storeStringByKey = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, value);
    } catch (e) {

    }
}

export const storeObjByKey = async (key, value) => {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value))
    } catch (e) {

    }
}

export const getStringByKey = async (keyName) => {
    try {
        const value = await AsyncStorage.getItem(keyName)
        return value != null ? value : null;
    } catch (e) {

    }
}

export const getObjByKey = async (keyName) => {
    try {
        const jsonValue = await AsyncStorage.getItem(keyName);
        return jsonValue != null ? JSON.parse(jsonValue) : null;

    } catch (e) {

    }
}

export const deleteByKeys = async (keys) => {
    // keys must be an array
    try {
        await AsyncStorage.multiRemove(keys)
    } catch (e) {

    }
}

export const clearAll = async () => {
    try {
        await AsyncStorage.clear()
    } catch (e) {
        // clear error
    }
}
