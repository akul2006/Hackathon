export const saveToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to local storage", error);
  }
};

export const loadFromLocalStorage = (key) => {
  try {
    const serializedValue = localStorage.getItem(key);
    if (serializedValue === null) {
      return undefined;
    }
    return JSON.parse(serializedValue);
  } catch (error) {
    console.error("Error loading from local storage", error);
    return undefined;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing from local storage", error);
  }
};