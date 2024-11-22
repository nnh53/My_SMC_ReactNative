import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal, Linking } from 'react-native';
import moment from 'moment';
import { useRouter, useLocalSearchParams } from 'expo-router'; // Adjust this import if you are not using expo-router
import AsyncStorage from '@react-native-async-storage/async-storage';

const CalendarScreen = () => {
    const router = useRouter();
    const { teamId } = useLocalSearchParams();
    const [currentWeek, setCurrentWeek] = useState(moment().startOf('week').add(1, 'day'));
    const [today, setToday] = useState<number>(moment().day()); // Use moment().day() to get day of the week as a number (0 for Sunday, 6 for Saturday)
    const [selectedDay, setSelectedDay] = useState<number>(today === 0 ? 7 : today + 1); // Initialize with today (Monday is 1 and Saturday is 7)
    const [events, setEvents] = useState<{ [key: string]: Array<{ startTime: string, endTime: string, note: string, meetingAddress: string, status: number, id: string }> }>({}); // State to store API events
    const [isLeader, setIsLeader] = useState<boolean>(false); // State to store if the user is a leader
    const [modalVisible, setModalVisible] = useState<boolean>(false); // State to control modal visibility
    const [confirmVisible, setConfirmVisible] = useState<boolean>(false); // State to control confirm modal visibility
    const [cancelVisible, setCancelVisible] = useState<boolean>(false); // State to control confirm modal visibility
    const [selectedEvent, setSelectedEvent] = useState<{ note: string, meetingAddress: string, id: string, status: number } | null>(null); // State to store selected event details

    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const getEventDays = (data: { [key: string]: Array<{ startTime: string, endTime: string, note: string }> }): number[] => {
        return Object.keys(data).map(day => {
            const parsedDay = moment(day, "dddd YYYY-MM-DD");
            // console.log('Parsed day:', parsedDay);
            return parsedDay.isoWeekday(); // Use isoWeekday to get Monday as 1 and Sunday as 7
        });
    };

    const fetchEvents = async () => {
        try {
            const token = await AsyncStorage.getItem('@userToken');
            const leaderStatus = await AsyncStorage.getItem('@isLeader');
            setIsLeader(leaderStatus === 'true');

            if (!token) {
                Alert.alert('No token found, please login.');
                return;
            }

            const response = await fetch('https://smnc.site/api/AppointmentSlots/Search', {
                method: 'POST',
                headers: {
                    'accept': '*/*',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    startTime: moment().startOf('week').format(),
                    endTime: moment().endOf('week').format(),
                    teamId: teamId,
                }),
            });
            const data = await response.json();
            setEvents(data.data); // Store the fetched events
            // console.log('Data:', data);

            // Determine the earliest event day and set the selected day accordingly
            const eventDays = getEventDays(data.data);
            // console.log('Event days after parsing:', eventDays);
            const earliestDay = Math.min(...eventDays);
            // console.log('Earliest Day:', earliestDay);
            setSelectedDay(today); // Adjust to match Monday (1) to Sunday (7)
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    useEffect(() => {
        moment.updateLocale('en', {
            week: {
                dow: 1, // Monday is the first day of the week.
                doy: 4  // The week that contains Jan 4th is the first week of the year.
            }
        });

        fetchEvents();
    }, [teamId]);

    const getDates = () => {
        const dates: string[] = [];
        for (let i = 0; i < 7; i++) {
            dates.push(currentWeek.clone().add(i, 'days').format('DD'));
        }
        return dates;
    };

    const generateTimeSlots = () => {
        const times: { key: string }[] = [];
        for (let i = 7; i <= 21; i++) {
            times.push({ key: `${i}:00 - ${i + 1}:00` });
        }
        return times;
    };

    const handleDayPress = (dayIndex: number) => {
        // console.log('Selected Day:', dayIndex + 1); // Debugging
        setSelectedDay(dayIndex + 1); // Update selected day (Monday to Sunday is 1 to 7)
    };

    const handleEventPress = (event: { note: string, meetingAddress: string, id: string, status: number }) => {
        setSelectedEvent(event);
        setModalVisible(true);
    };

    const handleAttendCancel = async (scheduleAppointment: boolean) => {
        if (selectedEvent) {
            try {
                const token = await AsyncStorage.getItem('@userToken');
                const response = await fetch(`https://smnc.site/api/AppointmentSlots/${selectedEvent.id}/ScheduleAppointment?teamId=${teamId}&scheduleAppointment=${scheduleAppointment}`, {
                    method: 'PATCH',
                    headers: {
                        'accept': '*/*',
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                // console.log('Response:', data);
                setModalVisible(false);
                setConfirmVisible(false);
                setCancelVisible(false);
                Alert.alert('Success', 'The appointment has been updated successfully.');
                // Refresh events after updating
                fetchEvents();
            } catch (error) {
                console.error('Error updating event:', error);
                Alert.alert('Error', 'There was an error updating the appointment.');
            }
        }
    };

    const getEventColor = (status: number) => {
        switch (status) {
            case 0: return '#FFA500'; // Available
            case 1: return '#00FF00'; // Scheduled
            case 2: return '#0000FF'; // InProgress
            case 3: return '#800080'; // Completed
            case 4: return '#FF0000'; // Cancelled
            case 5: return '#808080'; // Absent
            default: return '#000000'; // Default color
        }
    };

    useEffect(() => {
        // Function to update the date and week state
        const updateDate = () => {
            const newToday = moment().isoWeekday();
            setToday(newToday);
            setCurrentWeek(moment().startOf('week').add(1, 'day'));
        };

        // Initial update
        updateDate();

        // Calculate the time remaining until midnight
        const now = moment();
        const nextMidnight = moment().startOf('day').add(1, 'day');
        const timeUntilMidnight = nextMidnight.diff(now);

        // Set timeout to update at midnight, then set an interval for subsequent days
        const timeout = setTimeout(() => {
            updateDate();
            setInterval(updateDate, 24 * 60 * 60 * 1000); // Every 24 hours
        }, timeUntilMidnight);

        return () => clearTimeout(timeout);
    }, []);

    useEffect(() => {
        // console.log("Selected Day: ", selectedDay); // Debugging purpose to check selectedDay state
    }, [selectedDay]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={router.back} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerText}>Calendar</Text>
            </View>
            <Text style={styles.currentWeekText}>
                Current week: {currentWeek.startOf('isoWeek').format('DD/MM/YYYY')} - {currentWeek.endOf('isoWeek').format('DD/MM/YYYY')}
            </Text>

            <View style={styles.calendarHeader}>
                {daysOfWeek.map((day, index) => {
                    const date = currentWeek.clone().startOf('isoWeek').add(index, 'days').format('DD');
                    return (
                        <TouchableOpacity key={index} onPress={() => handleDayPress(index)} style={styles.dayContainer}>
                            <Text style={styles.dayText}>
                                {day}
                            </Text>
                            <Text style={[styles.dateText, currentWeek.clone().startOf('isoWeek').day(index + 1).isSame(moment(), 'day') && styles.todayHighlight]}>
                                {date}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <FlatList
                data={generateTimeSlots()}
                renderItem={({ item }) => (
                    <View style={styles.timeSlotRow}>
                        <View style={styles.timeSlot}>
                            <Text style={styles.timeText}>{item.key}</Text>
                        </View>
                        <View style={styles.eventSlot}>
                            {Object.keys(events).map(day => (
                                moment(day, "dddd YYYY-MM-DD").isoWeekday() === selectedDay &&
                                events[day].map((event, idx) => {
                                    const eventStartHour = parseInt(moment(event.startTime).format('HH'), 10);
                                    const timeSlotStartHour = parseInt(item.key.split(':')[0], 10);
                                    // console.log('Event Start Hour:', eventStartHour); // Debugging
                                    // console.log('Time Slot Start Hour:', timeSlotStartHour); // Debugging
                                    if (eventStartHour === timeSlotStartHour && (isLeader || [1, 2, 3].includes(event.status))) {
                                        return (
                                            <TouchableOpacity key={idx} style={[styles.sampleEvent, { backgroundColor: getEventColor(event.status) }]} onPress={() => handleEventPress(event)}>
                                                <Text style={styles.eventText}>{event.note}</Text>
                                            </TouchableOpacity>
                                        );
                                    }
                                    return null;
                                })
                            ))}
                        </View>
                    </View>
                )}
                keyExtractor={(item) => item.key}
                showsVerticalScrollIndicator={false}
            />
            {selectedEvent && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalVisible}
                    onRequestClose={() => {
                        setModalVisible(!modalVisible);
                    }}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalText}>Meeting Address:</Text>
                            <TouchableOpacity onPress={() => Linking.openURL(selectedEvent.meetingAddress)}>
                                <Text style={[styles.modalText, { color: 'blue', textDecorationLine: 'underline' }]}>
                                    {selectedEvent.meetingAddress}
                                </Text>
                            </TouchableOpacity>
                            {isLeader && selectedEvent.status === 0 && (
                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.buttonAttend]}
                                        onPress={() => setConfirmVisible(true)}
                                    >
                                        <Text style={styles.textStyle}>Attend</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.buttonCancel]}
                                        onPress={() => setCancelVisible(true)}
                                    >
                                        <Text style={styles.textStyle}>Cancel</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                            <TouchableOpacity
                                style={[styles.button, styles.buttonClose]}
                                onPress={() => setModalVisible(!modalVisible)}
                            >
                                <Text style={styles.textStyle}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
            {confirmVisible && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={confirmVisible}
                    onRequestClose={() => {
                        setConfirmVisible(!confirmVisible);
                    }}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalText}>Are you sure you want to attend this appointment?</Text>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonAttend]}
                                    onPress={() => handleAttendCancel(true)}
                                >
                                    <Text style={styles.textStyle}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonCancel]}
                                    onPress={() => setConfirmVisible(false)}
                                >
                                    <Text style={styles.textStyle}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
            {cancelVisible && (
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={cancelVisible}
                    onRequestClose={() => {
                        setCancelVisible(!cancelVisible);
                    }}
                >
                    <View style={styles.centeredView}>
                        <View style={styles.modalView}>
                            <Text style={styles.modalText}>Are you sure you want to cancel this appointment?</Text>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonAttend]}
                                    onPress={() => handleAttendCancel(false)}
                                >
                                    <Text style={styles.textStyle}>Yes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.buttonCancel]}
                                    onPress={() => setCancelVisible(false)}
                                >
                                    <Text style={styles.textStyle}>No</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingTop: 10,
    },
    header: {
        backgroundColor: '#003366',
        padding: 20,
        alignItems: 'center',
        flexDirection: 'row',
    },
    backButton: {
        position: 'absolute',
        left: 5,
    },
    backButtonText: {
        fontSize: 33,
        color: '#fff',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        flex: 1,
        marginTop: 30,
    },
    currentWeekText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003366',
        textAlign: 'center',
        marginVertical: 10,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    dayContainer: {
        alignItems: 'center',
        flex: 1,
    },
    timeSlotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    timeSlot: {
        width: 120, // Adjust width as needed
        paddingVertical: 10, // Ensure padding is consistent with content slot
        paddingHorizontal: 10,
        borderRightWidth: 1,
        borderRightColor: '#ddd',
    },
    timeText: {
        fontSize: 14,
        color: '#666',
    },
    eventSlot: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 50, // Set a minimum height to match time slot
    },
    sampleEvent: {
        backgroundColor: '#ffcc00',
        borderRadius: 5,
        padding: 5,
        marginVertical: 2,
    },
    eventText: {
        color: '#003366',
        fontWeight: 'bold',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 22,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '80%',
    },
    button: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
    },
    buttonAttend: {
        backgroundColor: '#2196F3',
    },
    buttonCancel: {
        backgroundColor: '#FF6347',
    },
    buttonClose: {
        backgroundColor: '#2196F3',
        marginTop: 15,
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 15,
        textAlign: 'center',
    },
    dayText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 5,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
    },
    todayHighlight: {
        color: '#fff',
        backgroundColor: '#003366',
        borderRadius: 50,
        padding: 5,
    },
});

export default CalendarScreen;

