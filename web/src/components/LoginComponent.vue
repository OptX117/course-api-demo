<template>
    <div class="login-container">
        <form ref="form">
            <div>
                <label for="username">Nutzername</label>
                <input id="username" type="text">
            </div>
            <div>
                <label for="password">Passwort</label>
                <input id="password" type="password">
            </div>
            <div class="btnRow">
                <button v-on:click.prevent="login" id="login-btn">Login</button>
            </div>
        </form>
    </div>
</template>

<script>
export default {
    name: 'LoginComponent',
    methods: {
        login: function() {

            const username = this.$refs.form.querySelector('input#username');
            const password = this.$refs.form.querySelector('input#password');

            const data = {
                username: username.value,
                password: password.value
            };

            this.$store.dispatch('logIn', data).then(result => {
                if(result) {
                    this.$router.push('/');
                }
            })
        }
    }
};
</script>

<style scoped lang="scss">
.login-container {
    height: 100%;
    display: flex;
    justify-content: center;
    flex-direction: column;

    form {
        width: 300px;
        margin: 0 auto;

        > div:not(.btnRow) {
            display: flex;
            justify-content: space-between;
        }

        > div.btnRow {
            width: fit-content;
            margin: 15px auto 0 auto;
        }
    }
}
</style>
