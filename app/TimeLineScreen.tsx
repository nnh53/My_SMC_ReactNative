import { useRouter } from 'expo-router';
import React, { useRef, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, Button, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

type Task = {
  name: string;
  category: Category;
  start: string;
  end: string;
};

const tasks: Task[] = [
  { name: 'Design LOGO', category: 'Design', start: '2024-01-05', end: '2024-02-10' },
  { name: 'Banner', category: 'Design', start: '2024-02-12', end: '2024-02-15' },
  { name: 'Research UI/UX', category: 'Design', start: '2024-03-05', end: '2024-03-20' },
  { name: 'Search Idea Project', category: 'Design', start: '2024-04-01', end: '2024-04-07' },
  { name: 'Make SRS', category: 'Development', start: '2024-05-10', end: '2024-05-15' },
  { name: 'FE', category: 'Development', start: '2024-06-12', end: '2024-06-25' },
  { name: 'Media Idea', category: 'Media', start: '2024-07-05', end: '2024-07-10' },
  { name: 'Ask Investors', category: 'Media', start: '2024-08-15', end: '2024-08-20' },
  { name: 'User Survey', category: 'Media', start: '2024-09-10', end: '2024-09-17' },
  { name: 'Marketing Idea', category: 'Marketing', start: '2024-10-05', end: '2024-10-12' },
  { name: 'Research Market', category: 'Economic', start: '2024-11-01', end: '2024-11-10' },
  { name: 'Launch Product', category: 'Marketing', start: '2024-12-20', end: '2024-12-25' },
];

type Category = 'Design' | 'Development' | 'Media' | 'Marketing' | 'Economic';
const categories: Record<Category, string> = { 
  Design: '#FF6347', 
  Development: '#4682B4', 
  Media: '#32CD32', 
  Marketing: '#FFD700', 
  Economic: '#8A2BE2', 
};

const TimelineScreen = () => {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(width)).current; // Initial value for slide: off-screen

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500, // Slide in over 0.5 seconds
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const handleBack = () => {
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 500, // Slide out over 0.5 seconds 
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setModalVisible(true);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getMonthIndex = (dateString: string) => {
    const date = new Date(dateString);
    return date.getMonth();
  };

  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX: slideAnim }] }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Time Line</Text>
      </View>
      <ScrollView style={styles.container}>
        {months.map((month, monthIndex) => (
          <View key={monthIndex} style={styles.table}>
            <Text style={styles.monthText}>{month.toUpperCase()}</Text>
            {tasks.filter(task => {
              const startMonthIndex = getMonthIndex(task.start);
              const endMonthIndex = getMonthIndex(task.end);
              return startMonthIndex <= monthIndex && endMonthIndex >= monthIndex;
            }).map((task, taskIndex) => (
              <TouchableOpacity
                key={taskIndex}
                style={[
                  styles.task,
                  {
                    backgroundColor: categories[task.category],
                  },
                ]}
                onPress={() => handleTaskPress(task)}
              >
                <Text style={styles.taskName}>{task.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        {selectedTask && (
          <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>{selectedTask.name}</Text>
                <Text style={styles.modalText}>Start Date: {selectedTask.start}</Text>
                <Text style={styles.modalText}>End Date: {selectedTask.end}</Text>
                <Button title="Close" onPress={() => setModalVisible(false)} />
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  table: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 10,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  task: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  taskName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
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
    color: '#fff'
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
    marginTop:30
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default TimelineScreen;
