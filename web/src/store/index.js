import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

export default new Vuex.Store({
    state: {
        user: undefined,
        bookings: undefined,
        courses: undefined,
        dates: {}
    },
    mutations: {
        setUser(state, user) {
            state.user = user;
        },
        setBookings(state, bookings) {
            state.bookings = bookings;
        },
        setCourses(state, courses) {
            state.courses = courses;
        },
        setDates(state, update) {
            state.dates = Object.assign(state.dates, update);
        }
    },
    actions: {
        async getUserInfo(context) {
            const user = await axios.get('/users/me')
                .then(res => {
                    if (res.status === 200) {
                        return res.data;
                    } else {
                        return null;
                    }
                }, () => null);

            if (user != null) {
                context.commit('setUser', user);
                return true;
            }
            return false;
        },
        async logIn(context, value) {
            const user = await axios.post('/users/login', value, {
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(res => {
                if (res.status === 200) {
                    return res.data;
                } else if (res.status === 204) {
                    return context.dispatch('getUserInfo');
                } else {
                    return null;
                }
            }, () => null);

            if (user != null) {
                if (user === true)
                    return true;
                context.commit('setUser', user);
                return true;
            }
        },
        async updateBookings(context) {
            const bookings = await axios.get('/users/bookings')
                .then(res => {
                    return res.data;
                }, () => null);

            if (bookings) {
                context.commit('setBookings', bookings);
                return true;
            }
            return false;
        },
        async updateCourses(context) {
            const courses = await axios.get('/courses')
                .then(res => {
                    return res.data;
                }, err => {
                    console.error(err);
                });
            if (courses) {
                context.commit('setCourses', courses);
            }
        },
        async updateDates(context, courseid) {
            const dates = await axios.get('/courses/' + courseid+'/dates')
                .then(res => {
                    return res.data;
                }, err => {
                    console.error(err);
                });
            if (dates) {
                context.commit('setDates', {
                    [courseid]: dates
                });
            }
        }
    },
    getters: {
        getUser: state => state.user,
        getBookings: state => state.bookings,
        getCourses: state => state.courses,
        getDates: state => state.dates
    },
    modules: {}
});
