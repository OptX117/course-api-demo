<template>
    <div class="courses-container">
        <div class="course-container" v-if="course">
            <h3 class="course-title">Titel: {{ course.title }}</h3>
            <div class="course-subtitle">
                <div class="course-category">Kategorie: {{ course.category }}</div>
                <div class="course-lecturer">Dozent: {{ course.lecturer.name }}</div>
            </div>
            <div class="course-description">{{ course.description }}</div>
            <div class="sub-actions">
                <div class="course-price">Preis: {{ course.price }}€</div>
                <router-link :to="{ name: 'Termine', params: {courseid}}">Termine ({{ courseDates.length }} verfügbar)
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
import {mapGetters} from 'vuex';

export default {
    name: 'CourseComponent',
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
.courses-container {
    width: 500px;
    margin: 100px auto 0 auto;

    .course-container {
        box-shadow: 0 5px 18px 0 rgba(151, 124, 156, 0.2), 0 5px 32px 0 rgba(203, 195, 212, 0.2), 0 8px 58px 0 rgba(216, 212, 221, 0.1);
        padding: 10px;

        > h3 {
            margin-top: 0;
        }

        .sub-actions {
            display: flex;
            justify-content: space-between;
        }
    }

    .course-subtitle {
        display: flex;
        justify-content: space-around;
        margin-bottom: 10px;

        > * {
            display: inline-block;
        }
    }
}
</style>
