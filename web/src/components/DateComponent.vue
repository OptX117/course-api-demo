<template>
    <div class="date-container">
        <div class="date" v-for="courseDate in dates" :key="courseDate.id">
            <div class="booking-header">
                <div class="booking-start-date">Start: <b>{{ getFormattedDate(courseDate.startDate) }} </b></div>
                <div class="booking-end-date">Ende: <b>{{ getFormattedDate(courseDate.endDate) }} </b></div>
            </div>
            <div class="booking-spots">Plätze:
                <div class="open-spots"><b>{{ courseDate.availableSpots }}</b></div>
                von
                <div class="total-spots"><b>{{ courseDate.totalSpots }}</b></div>
                verfügbar
            </div>
            <div class="last-row">
                <div class="location">
                    Ort: <b>{{ courseDate.location }}</b>
                </div>
                <div class="booking">
                    <input :id="courseDate.id + 'bookSpots'" type="number" min="0" :max="courseDate.availableSpots">
                    <button v-if="user.id != null" v-on:click="book(courseDate)">Buchen</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {mapState} from 'vuex';
import moment from 'moment';

export default {
    name: 'DateComponent',
    props: {
        courseid: String
    },
    computed: {
        ...mapState({
            courses: 'courses',
            user: 'user',
            bookings: 'bookings',
            dates: 'dates'
        })
    },
    mounted() {
        this.$store.dispatch('updateDates', this.courseid);
    },
    methods: {
        getFormattedDate(isoDate) {
            return moment(isoDate).locale('de').format('dddd, DoMM.YYYY, HH:mm [Uhr]');
        },
        book(courseDate) {
            const course = this.courses.find(course => course.id === this.courseid);
            const number = this.$el.querySelector('input#'+courseDate.id+'bookSpots').value;
            if(number <= courseDate.availableSpots) {
                this.$store.dispatch('bookDates', {course, date: courseDate, spots: number}).then(() => {
                    this.$store.dispatch('updateDates', this.courseid);
                });
            }
        }
    }

};
</script>

<style scoped lang="scss">
.date-container {
    margin: 100px auto 0 auto;
    width: 500px;

    .date {
        box-shadow: 0 5px 18px 0 rgba(151, 124, 156, 0.2), 0 5px 32px 0 rgba(203, 195, 212, 0.2), 0 8px 58px 0 rgba(216, 212, 221, 0.1);
        padding: 5px;
        margin: 5px;

        .booking-spots {
            margin-top: 10px;

            .open-spots, .total-spots {
                display: inline;
            }
        }

        .last-row {
            display: flex;
            justify-content: space-between;
            display: flex;
            margin-top: 10px;
        }
    }
}

</style>
