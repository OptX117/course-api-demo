import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';
import debounce from 'p-debounce';

Vue.use(Vuex);

const debouncedBookings = debounce(function (context) {
    return axios.get('/api/v1/users/bookings')
        .then(res => {
            return res.data;
        }, () => null).then(async bookings => {
            if (bookings) {
                let courses = context.state.courses;
                if (courses.length === 0) {
                    await context.dispatch('updateCourses');
                    courses = context.state.courses;
                }

                if (courses.length === 0) {
                    return false;
                }

                console.log(bookings, courses);

                const ret = {};
                for (const booking of bookings) {
                    let course = courses.find(course => course.id === booking.course);
                    if (course) {
                        if (!ret[course.id])
                            ret[course.id] = [];
                        ret[course.id].push(booking);
                    }
                }

                context.commit('setBookings', ret);

                return true;
            }
            return false;
        });
}, 1000, {leading: true});

const debouncedCourses = debounce(async function (context) {
    const courses = await axios.get('/api/v1/courses')
        .then(res => {
            return res.data;
        }, err => {
            console.error(err);
        });
    if (courses) {
        context.commit('setCourses', courses);
    }
}, 1000, {leading: true});

export default new Vuex.Store({
    state: {
        user: {},
        bookings: {},
        courses: [],
        dates: []
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
        setDates(state, dates) {
            state.dates = dates;
        }
    },
    actions: {
        async getUserInfo(context) {
            const user = await axios.get('/api/v1/users/me')
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
            const user = await axios.post('/api/v1/users/login', value, {
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
            await debouncedBookings(context);
        },
        async updateCourses(context) {
            await debouncedCourses(context);
        },
        async updateDates(context, courseid) {
            const dates = await axios.get('/api/v1/courses/' + courseid + '/dates')
                .then(res => {
                    return res.data;
                }, err => {
                    console.error(err);
                });
            if (dates) {
                context.commit('setDates', dates);
            }
        },
        async bookDates(context, {course, date, spots}) {
            if (await axios.post(`/api/v1/courses/${course.id}/dates/${date.id}/bookings`, {
                spots: +spots
            }).then(res => res.data, err => {
                console.error(`Error booking a spot for course ${course.id} and date ${date.id}`, err);
                return false;
            })) {
                await context.dispatch('updateCourses');
                await context.dispatch('updateBookings');
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
