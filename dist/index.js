'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const isArray = a => Array.isArray(a);

const isFunction = f => typeof f === 'function';

const isObject = o => o != null && typeof o === 'object' && !isArray(o);

const isObjectObject = o =>
  isObject(o) === true && Object.prototype.toString.call(o) === '[object Object]';

const isPlainObject = o => {
  var ctor, prot;
  if (isObjectObject(o) === false) return false
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false
  }
  return true
};

const invariant = (b, s) => {
  if (!b) {
    throw new Error(s)
  }
};

function isFunctionObject(obj) {
  return isPlainObject(obj) && Object.keys(obj).every(key => isFunction(obj[key]))
}

function checkModel(model, existModels) {
  const { namespace, reducers, effects } = model;

  // namespace 必须被定义
  invariant(namespace, `[model] namespace should be defined`);
  // 并且是字符串
  invariant(
    typeof namespace === 'string',
    `[model] namespace should be string, but got ${typeof namespace}`
  );
  // 并且唯一
  invariant(
    !existModels.some(model => model.namespace === namespace),
    `[model] namespace should be unique`
  );

  // state 可以为任意值

  // reducers 可以为空，PlainObject
  if (reducers) {
    invariant(
      isFunctionObject(reducers),
      `[model] reducers should be plain function object, but got ${typeof reducers}`
    );
  }

  // effects 可以为空，PlainObject
  if (effects) {
    invariant(
      isFunctionObject(effects),
      `[model] effects should be plain function object, but got ${typeof effects}`
    );
  }
}

const NAMESPACE_SEP = '/';

function createAction(model) {
  const reducerAction = Object.keys(model.reducers || []).reduce((reducer, key) => {
    return {
      ...reducer,
      [key]: function(payload) {
        return {
          type: `${model.namespace}${NAMESPACE_SEP}${key}`,
          payload
        }
      }
    }
  }, {});
  const effectAction = Object.keys(model.effects || []).reduce((effects, key) => {
    return {
      ...effects,
      [key]: payload => (dispatch, getState) => {
        const _dispatch = (actionTypes, param) => {
          dispatch(reducerAction[actionTypes](param));
        };
        model.effects[key](payload, _dispatch, getState);
      }
    }
  }, {});
  return { ...reducerAction, ...effectAction }
}

function createReducer(model) {
  const reducerObj = Object.keys(model.reducers || []).reduce((reducer, key) => {
    return {
      ...reducer,
      [`${model.namespace}${NAMESPACE_SEP}${key}`]: model.reducers[key]
    }
  }, {});
  return function(state = model.state, action) {
    if (reducerObj.hasOwnProperty(action.type)) {
      return reducerObj[action.type](action.payload, state)
    }
    return state
  }
}

const existModels = [];

function model(model) {
  checkModel(model, existModels);
  existModels.push(model.namespace);
  return {
    actions: createAction(model),
    reducer: createReducer(model)
  }
}

exports.model = model;
