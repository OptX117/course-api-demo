<template>
    <div id="app">
        <HeaderNav></HeaderNav>
        <router-view></router-view>
    </div>
</template>

<script>
import HeaderNav from '@/components/HeaderNav';

export default {
    name: 'App',
    components: {
        HeaderNav
    },
    mounted() {
        this.$store.dispatch('getUserInfo').then(ret => {
            if (ret)
                this.$store.dispatch('updateBookings');
        });
    }
};
</script>

<style>
html, body, #app {
    height: 100%;
}

</style>
