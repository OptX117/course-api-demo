<template>
    <div class="date-container">
        <div class="date" v-for="courseDate in courseDates || []" :key="courseDate.id">
            <h3 class="booking-header">Start: <b>{{courseDate.startDate}} </b></h3>
            <h3 class="booking-header">Ende: <b>{{courseDate.endDate}} </b></h3>
            <div class="booking-spots">Plätze<div class="open-spots"> <b>{{ courseDate.availableSpots }}</b></div> von <div class="total-spots"><b>{{courseDate.totalSpots}}</b></div> verfügbar</div>
        </div>
    </div>
</template>

<script>
import {mapGetters} from 'vuex';

export default {
    name: 'DateComponent',
    props: {
        courseid: String
    },
    computed: {
        ...mapGetters({
            courses: 'getCourses',
            dates: 'getDates'
        }),
        course() {
            if (this.courses)
                return this.courses.find(course => course.id === this.courseid);
            else
                return null;
        },
        courseDates() {
            if (this.course) {
                return this.dates[this.courseid] || [];
            } else {
                return [];
            }
        }
    },
    mounted() {
        this.$store.dispatch('updateDates', this.courseid);
    }

};
</script>

<style scoped lang="scss">
.date-container {
    margin-top: 100px;
}
</style>
