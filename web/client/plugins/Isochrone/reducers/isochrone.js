import {
    SEARCH_ERROR,
    SEARCH_LOADING,
    SEARCH_RESULTS_LOADED,
    SET_ISOCHRONE_DATA,
    SET_ISOCHRONE_LOADING,
    UPDATE_LOCATION
} from "../actions/isochrone";

/**
 * Reducer for itinerary search functionality
 * Manages loading state, search results, and error state
 */
const itinerary = (state = {
    searchLoading: false,
    searchResults: [],
    searchError: null,
    location: null
}, action) => {
    switch (action.type) {
    case SEARCH_LOADING:
        return {
            ...state,
            searchLoading: action.loading,
            // Clear error when starting a new search
            ...(action.loading && { error: null })
        };

    case SEARCH_RESULTS_LOADED:
        return {
            ...state,
            searchResults: action.results,
            searchError: null
        };

    case SEARCH_ERROR:
        return {
            ...state,
            searchError: action.error,
            searchResults: []
        };
    case UPDATE_LOCATION:
        return {
            ...state,
            location: action.location
        };
    case SET_ISOCHRONE_DATA:
        const data = action.data ? [...(state?.data ?? []), action.data] : [];
        return { ...state, data };
    case SET_ISOCHRONE_LOADING:
        return {
            ...state,
            loading: action.loading
        };
    default:
        return state;
    }
};

export default itinerary;
