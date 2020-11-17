<template>
    <header>
        <div id="links">
            <div>
                <router-link to="/courses" id="courses-link">Kurse</router-link>
                <router-link to="/booked" id="bookings-link" v-if="this.user.id != null">Gebuchte Termine</router-link>
            </div>
        </div>
        <div id="title">{{ this.currentRouteName }}</div>
        <div id="login-container">
            <button v-on:click="this.goToLogin" v-if="this.user.id == null" id="login-link">Login</button>
        </div>
    </header>
</template>

<script>
import Vue from 'vue';
import {mapGetters} from 'vuex';

export default Vue.component('HeaderNav', {
    name: 'HeaderNav',
    methods: {
        goToLogin: function () {
            this.$router.push('/login');
        }
    },
    computed: {
        currentRouteName() {
            return this.$route.name;
        },
        ...mapGetters({
            user: 'getUser'
        })
    }
});
</script>

<style scoped lang="scss">
header {
    position: fixed;
    top: 0;
    left: 0;
    height: 75px;
    width: 100%;
    box-shadow: 0 5px 18px 0 rgba(151, 124, 156, 0.2), 0 5px 32px 0 rgba(203, 195, 212, 0.2), 0 8px 58px 0 rgba(216, 212, 221, 0.1);
    background: #eee;

    display: flex;
    justify-content: space-between;

    #login-container {
        display: flex;
        flex-direction: column;
        justify-content: center;

        > button {
            margin-right: 50px;
            height: 30px;
        }
    }

    #title, #links {
        display: flex;
        justify-content: center;
        flex-direction: column;
    }

    #links {
        width: 250px;

        > div {
            display: flex;
            justify-content: space-around;
        }
    }
}
</style>
