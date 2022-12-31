const { join } = require('path');
const fs = require('fs');

const localeDir = join(__dirname, '..', 'src', 'locale');

// the suffixes of keys related to i18n functionality that should be ignored.
const ignoreSubstrings = ['_one', '_two', '_few', '_many', '_other'];

// check whether a key ends with an `ignoreSubstring`.
const endsWithIgnoreSubstring = (key) =>
  ignoreSubstrings.some((i) => key.endsWith(i));

// locale directories, ommitting `en` - the langauge to check missing keys against.
const getDirectories = (source) =>
  fs
    .readdirSync(source, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .filter((v) => v.name !== 'en')
    .map((dirent) => dirent.name);

// recursive function to get all keys of a locale object.
const getDeepKeys = (obj) => {
  let keys = [];
  for (const key in obj) {
    let isSubstring = false;

    // not number.
    if (isNaN(key)) {
      // check if key includes any special substrings.
      if (endsWithIgnoreSubstring(key)) {
        isSubstring = true;
        // get the substring up to the last underscore.
        const rawKey = key.substring(0, key.lastIndexOf('_'));
        // add the key to `keys` if it does not already exist.
        if (!keys.includes(rawKey)) {
          keys.push(rawKey);
        }
      }
    }

    // full string, if not already added, go ahead and add.
    if (!isSubstring) {
      if (!keys.includes(key)) {
        keys.push(key);
      }
    }

    // if object, recursively get keys.
    if (typeof obj[key] === 'object') {
      const subkeys = getDeepKeys(obj[key]);
      keys = keys.concat(subkeys.map((subkey) => `${key}.${subkey}`));
    }
  }
  return keys;
};

const defaultPath = join(localeDir, 'en');
const languages = getDirectories(localeDir);

fs.readdir(defaultPath, (error, files) => {
  if (error) console.log(error);

  files.forEach((file) => {
    const defaultJson = JSON.parse(
      fs.readFileSync(join(defaultPath, file)).toString()
    );

    languages.forEach((lng) => {
      const otherPath = join(localeDir, lng);
      const otherJson = JSON.parse(
        fs.readFileSync(join(otherPath, file)).toString()
      );

      const a = getDeepKeys(defaultJson);
      const b = getDeepKeys(otherJson);

      if (a.sort().length !== b.sort().length) {
        const missing = a.filter((item) => b.indexOf(item) < 0);
        if (missing.join('').trim().length > 0) {
          throw new Error(
            `Missing the following keys from locale "${lng}", file: "${file}":\n"${missing}".`
          );
        }
      }
    });
  });
});