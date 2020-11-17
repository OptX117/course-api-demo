import Vue from 'vue';
import App from './App.vue';
import store from './store';
import VueRouter from 'vue-router';
import LoginComponent from '@/components/LoginComponent';
import LandingComponent from '@/components/LandingComponent';
import BookingsComponent from '@/components/BookingsComponent';
import CourseComponent from '@/components/CourseComponent';
import CourseCatalogComponent from '@/components/CourseCatalogComponent';
import DateComponent from '@/components/DateComponent';


Vue.config.productionTip = false;

Vue.use(VueRouter);

const routes = [
    {path: '/login', component: LoginComponent, name: 'Login'},
    {path: '/', component: LandingComponent, name: 'Home'},
    {path: '/booked', component: BookingsComponent, name: 'Buchungen'},
    {
        path: '/courses/:courseid', component: CourseComponent, name: 'Einzelkurs', props: true
    },
    {
        path: '/courses/:courseid/dates', component: DateComponent, name: 'Termine', props: true
    },
    {
        path: '/courses', component: CourseCatalogComponent, name: 'Kurse'
    },
    {path: '*', redirect: '/'}
];




// 3. Create the router instance and pass the `routes` option
// You can pass in additional options here, but let's
// keep it simple for now.
const router = new VueRouter({
    routes // short for `routes: routes`
});

router.beforeEach((to, from, next) => {
    if (!['Login', 'Home', 'Kurse', 'Einzelkurs', 'Termine'].includes(to.name) && !store.state.user.id) next({ name: 'Login' })
    else next()
})

new Vue({
    store,
    router,
    render: h => h(App)
}).$mount('#app');
