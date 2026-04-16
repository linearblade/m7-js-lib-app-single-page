/*
 * Copyright (c) 2026 m7.org
 * License: MTL-10 (see LICENSE.md)
 */

export function make(lib) {
    function keys()
    {
	const allKeys = [];
	for (let i = 0; i < localStorage.length; i++) {
	    allKeys.push(localStorage.key(i));
	}
	return allKeys;
    }
    function get(key,opts={})
    {
        opts = lib.hash.to(opts,'json');

        const rec = opts.json?
              JSON.parse(localStorage.getItem(key)):
              localStorage.getItem(key);
        return rec;
    }
    function set(key,data)
    {
        const store = lib.utils.isScalar(data)?
              data:
              JSON.stringify(data);

        localStorage.setItem(
            key,
            store
        );
    }
    function  deleteLocalStorage(key)
    {
        localStorage.removeItem(key);
    }
    return {
	set, get, delete:deleteLocalStorage,keys
    };
}

export default make;
