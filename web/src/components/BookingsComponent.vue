<template>
    <div class="bookings-container">
        <div class="booking-container" v-for="booking in mappedBookings" :key="booking.id" :data-cy="`booking-${booking.id}`">
            <h3 class="booking-header">Kurs: <b>
                <router-link :to="{ name: 'Einzelkurs', params: {courseid: booking.courseLink}}">{{
                        booking.courseTitle
                    }}
                </router-link>
            </b></h3>
            <div class="booking-spots">Gebuchte Plätze <b>{{ booking.spots }}</b></div>
        </div>
    </div>
</template>

<script>
import {mapState} from 'vuex';

export default {
    name: 'BookingsComponent',
    computed: {
        ...mapState({
            bookings: 'bookings',
            courses: 'courses'
        }),
        mappedBookings: function () {
            return this.courses.map(course => {
                const bookings = this.bookings[course.id];
                if(!bookings) return [];
                return bookings.map(booking => ({
                    courseTitle: course.title,
                    courseLink: course.id,
                    spots: booking.spots,
                    id: booking.id
                }))
            }).reduce((previousValue, currentValue) => {
                previousValue.push(...currentValue);
                return previousValue;
            }, []);
        }
    },
    mounted() {
        this.$store.dispatch('updateBookings');
    }
};
</script>

<style scoped lang="scss">
.bookings-container {
    margin: 100px auto 0 auto;
    width: 500px;

    .booking-container {
        box-shadow: 0 5px 18px 0 rgba(151, 124, 156, 0.2), 0 5px 32px 0 rgba(203, 195, 212, 0.2), 0 8px 58px 0 rgba(216, 212, 221, 0.1);
        padding: 5px;
        height: 150px;
        margin: 5px;

        > h3 {
            margin-top: 0;
        }
    }
}
</style>
