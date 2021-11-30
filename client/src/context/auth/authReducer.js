import {
  REGISTER_FAIL,
  REGISTER_SUCCESS,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  CLEAR_ERRORS,
  LOGOUT,
  REFRESH_TOKEN,
  AUTH_ERROR,
  USER_LOADED,
  SET_LOADING
} from '../types';

const reducer = (state, action) => {
  switch (action.type) {
    case REGISTER_SUCCESS:
    case LOGIN_SUCCESS:
      {
        localStorage.setItem('accessToken', action.payload);
        return {
          ...state,
          isAuthenticated: true,
          error: null,
          accessToken: action.payload,
          loading: false
        }
      }

    case REGISTER_FAIL:
    case LOGIN_FAIL:
    case AUTH_ERROR:
      {
        localStorage.removeItem('accessToken');
        return {
          ...state,
          isAuthenticated: false,
          error: action.payload,
          accessToken: null,
          loading: false
        }
      }

    case USER_LOADED: {
      console.log('Load user success!')
      return {
        ...state,
        isAuthenticated: true,
        error: null,
        user: action.payload,
        loading: false
      }
    }

    case LOGOUT: {
      localStorage.removeItem('accessToken');
      return {
        ...state,
        isAuthenticated: false,
        error: null,
        accessToken: null,
        loading: false,
        user: null
      }
    }

    case REFRESH_TOKEN: {
      localStorage.setItem('accessToken', action.payload)
      console.log('refresh token Succes')
      return {
        ...state,
        error: null,
        accessToken: action.payload,
        loading: true
      }
    }

    case CLEAR_ERRORS: {
      return {
        ...state,
        error: null
      }
    }

    case SET_LOADING: {
      return {
        ...state,
        loading: action.payload
      }
    }

    default: {
      return { ...state }
    }
  }
}

export default reducer