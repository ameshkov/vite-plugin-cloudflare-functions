'use strict';

const axios = require('axios');

function _interopDefaultCompat (e) { return e && typeof e === 'object' && 'default' in e ? e.default : e; }

const axios__default = /*#__PURE__*/_interopDefaultCompat(axios);

function useFunctions(config = {}) {
  const api = axios__default.create(config);
  return {
    async get(url, config2) {
      return (await api.get(url, config2)).data;
    },
    async post(url, data, config2) {
      return (await api.post(url, data, config2)).data;
    },
    async put(url, data, config2) {
      return (await api.put(url, data, config2)).data;
    },
    async patch(url, data, config2) {
      return (await api.patch(url, data, config2)).data;
    },
    async delete(url, config2) {
      return (await api.delete(url, config2)).data;
    },
    async head(url, config2) {
      return (await api.head(url, config2)).data;
    },
    async options(url, config2) {
      return (await api.options(url, config2)).data;
    },
    raw: {
      async get(url, config2) {
        return api.get(url, config2);
      },
      async post(url, data, config2) {
        return api.post(url, data, config2);
      },
      async put(url, data, config2) {
        return api.put(url, data, config2);
      },
      async patch(url, data, config2) {
        return api.patch(url, data, config2);
      },
      async delete(url, config2) {
        return api.delete(url, config2);
      },
      async head(url, config2) {
        return api.head(url, config2);
      },
      async options(url, config2) {
        return api.options(url, config2);
      }
    }
  };
}

exports.useFunctions = useFunctions;
