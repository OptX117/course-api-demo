import {createLocalVue, shallowMount} from '@vue/test-utils';
import Vuex from 'vuex';
import BookingsComponent from '@/components/BookingsComponent';
import sinon from 'sinon';
import Chai, {expect} from 'chai';
import sinonChai from 'sinon-chai';

Chai.use(sinonChai);

const localVue = createLocalVue();

localVue.use(Vuex);

function setCourseAndBookings(store) {
    const courses = [
        {
            id: '5fb2dbedc6fe6e23e4202fdd',
            title: 'TEST',
            lecturer: 'TEST',
            description: 'TEST',
            price: 'TEST',
            dates: [{
                'id': 'dzj2',
                'startDate': '2020-11-13T18:00:00+01:00',
                'endDate': '2020-11-13T20:00:00+01:00',
                'totalSpots': 10,
                'location': 'Domplatte'
            }, {
                'id': 'JoQj',
                'startDate': '2020-11-20T18:00:00+01:00',
                'endDate': '2020-11-20T20:00:00+01:00',
                'totalSpots': 5,
                'location': 'PLANET X'
            }],
            category: 'Konferenz'
        }];

    const bookings = {
        '5fb2dbedc6fe6e23e4202fdd': [
            {
                'id': '5fb2dbedc6fe6e23e4202fde',
                'course': '5fb2dbedc6fe6e23e4202fdd',
                'user': '5fb2dbedc6fe6e23e4202fda',
                'spots': 2,
                'date': 'dzj2'
            },
            {
                'id': '5fb2dbedc6fe6e23e4202fdf',
                'course': '5fb2dbedc6fe6e23e4202fdd',
                'user': '5fb2dbedc6fe6e23e4202fda',
                'spots': 3,
                'date': 'JoQj'
            },
            {
                'id': '5fb2dbedc6fe6e23e4202fe0',
                'course': '5fb2dbedc6fe6e23e4202fdd',
                'user': '5fb2dbedc6fe6e23e4202fdc',
                'spots': 1,
                'date': 'JoQj'
            }
        ]
    };

    store.commit('setCourses', courses);
    store.commit('setBookings', bookings);
}

describe('BookingsComponent', () => {
    let actions;
    let store;
    let state;
    let mutations;

    beforeEach(() => {


        actions = {
            updateBookings: sinon.stub()
        };
        state = {
            user: {},
            bookings: {},
            courses: [],
            dates: []
        };
        mutations = {
            setCourses(state, val) {
                state.courses = val;
            },
            setBookings(state, val) {
                state.bookings = val;
            }
        };
        store = new Vuex.Store({
            actions,
            state,
            mutations
        });
    });

    it('should call $store updateBookings', () => {
        shallowMount(BookingsComponent, {store, localVue});
        expect(actions.updateBookings).to.have.been.calledOnce;
    });

    it('it should correctly calculate mappedBookings', () => {
        const wrapper = shallowMount(BookingsComponent, {store, localVue});

        setCourseAndBookings(store);

        const {mappedBookings} = wrapper.vm;
        expect(mappedBookings).to.eql(
            [
                {
                    courseTitle: 'TEST',
                    courseLink: '5fb2dbedc6fe6e23e4202fdd',
                    spots: 2,
                    id: '5fb2dbedc6fe6e23e4202fde'
                },
                {
                    courseTitle: 'TEST',
                    courseLink: '5fb2dbedc6fe6e23e4202fdd',
                    spots: 3,
                    id: '5fb2dbedc6fe6e23e4202fdf',
                },
                {
                    courseTitle: 'TEST',
                    courseLink: '5fb2dbedc6fe6e23e4202fdd',
                    spots: 1,
                    id: '5fb2dbedc6fe6e23e4202fe0',
                }
            ]);
    });

    it('should correctly render the mappedBookings', (cb) => {
        const wrapper = shallowMount(BookingsComponent, {store, localVue});
        setCourseAndBookings(store);
        const {mappedBookings} = wrapper.vm;

        wrapper.vm.$nextTick(() => {
            try {
                for (const mappedBooking of mappedBookings) {
                    const container = wrapper.find(`div[data-cy="booking-${mappedBooking.id}"]`);
                    expect(container.exists()).to.be.true;
                    const titleLink = wrapper.find(`div[data-cy="booking-${mappedBooking.id}"] router-link`);
                    expect(titleLink.exists()).to.be.true;
                    expect(titleLink.text()).to.eql('TEST');
                    const bookingSpots = wrapper.find(`div[data-cy="booking-${mappedBooking.id}"] .booking-spots`);
                    expect(bookingSpots.exists()).to.be.true;
                    expect(bookingSpots.text()).to.eql('Gebuchte Plätze ' + mappedBooking.spots);
                }
            } catch (err) {
                cb(err);
            }
            cb();
        });

    });
});
