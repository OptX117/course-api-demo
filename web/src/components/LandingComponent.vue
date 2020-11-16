<template>
    <div id="landing-container">
        <h1>Moin.</h1>
        <p>Rechts oben einloggen, wenn nicht schon geschehen.</p>
        <p>Dann links oben Ansicht auswählen.</p>
        <p>Logout ist nicht implementiert, aber einfach cookies löschen reicht :)</p>
    </div>
</template>

<script>
export default {
    name: 'LandingComponent'
};
</script>

<style scoped lang="scss">
#landing-container {
    width: 500px;
    margin: 100px auto 0 auto;
}
</style>
