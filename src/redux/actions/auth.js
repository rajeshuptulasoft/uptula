import { getObjByKey, deleteByKeys } from '../../utils/Storage';
import { AUTH_STATUS } from '../types';

export const checkuserToken = () => {
    return async (dispatch) => {
        try {
            const res = await getObjByKey("loginResponse");
            dispatch({
                type: AUTH_STATUS,
                payload: !!res,
            });
            return !!res;
        } catch (error) {
            dispatch({
                type: AUTH_STATUS,
                payload: false,
            });
            return false;
        }
    };
};

export const logoutUser = () => {
    return async (dispatch) => {
        await deleteByKeys(['loginResponse', 'fcmtoken']);
        dispatch({
            type: AUTH_STATUS,
            payload: false,
        });
    };
};
