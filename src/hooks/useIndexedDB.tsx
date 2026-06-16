import { useEffect, useState } from "react";
import { openDB } from "idb";
import CryptoJS from "crypto-js";

const DB_NAME = "AppStorage";
const STORE_NAME = "KeyValueStore";
const ENCRYPTION_KEY = "your-secure-passphrase"; // Ideally from env

// Encrypt data
const encrypt = (data: any): string => {
  const stringified = JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringified, ENCRYPTION_KEY).toString();
};

// Decrypt data
const decrypt = (cipherText: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch (error) {
    console.warn("Decryption failed. Returning fallback.");
    return null;
  }
};

// Open or upgrade IndexedDB
const getDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

// Load saved value or fallback
async function getSavedValue<T>(key: string, initialValue: T | (() => T)): Promise<T> {
  const db = await getDB();
  const encrypted = await db.get(STORE_NAME, key);

  if (encrypted !== undefined && encrypted !== null) {
    const decrypted = decrypt(encrypted);
    if (decrypted !== null) return decrypted as T;
  }

  return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
}

// Custom hook with encryption support
export function useIndexedDB<T>(
  key: string,
  initialValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>, () => Promise<void>] {
  const [value, setValue] = useState<T>(
    typeof initialValue === "function" ? (initialValue as () => T)() : initialValue
  );

  // On mount: load decrypted value from DB
  useEffect(() => {
    let isMounted = true;

    (async () => {
      const stored = await getSavedValue<T>(key, initialValue);
      if (isMounted) setValue(stored);
    })();

    return () => {
      isMounted = false;
    };
  }, [key]);

  // On value change: encrypt and store in DB
  useEffect(() => {
    (async () => {
      const db = await getDB();
      const encrypted = encrypt(value);
      await db.put(STORE_NAME, encrypted, key);
    })();
  }, [key, value]);

  // Remove value from DB and reset
  const removeItem = async () => {
    const db = await getDB();
    await db.delete(STORE_NAME, key);
    const fallback = typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    setValue(fallback);
  };

  return [value, setValue, removeItem];
}
