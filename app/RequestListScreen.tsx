import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define the JoinRequest and Student interfaces
interface JoinRequest {
    type: string;
    teamId: string;
    senderId: string;
    createdDate: string;
    status: number;
    comment: string;
    id: string;
    // Add other fields as necessary
}

interface Student {
    studentName: string;
    studentCode: string;
    studentDepartment: string;
    campus: string;
    phoneNumber: string;
    skills: Skill[];
    studentLecturers: string[];
}

interface Skill {
    skillName: string;
    skillDescription: string;
    skillType: string;
    skillLevel: string;
    isDeleted: boolean;
}

type DetailedJoinRequest = JoinRequest & Student;

const fetchStudentDetails = async (accountId: string, token: string): Promise<Student | null> => {
    try {
        const response = await fetch(`https://smnc.site/api/Student/GetStudentByAccId/${accountId}`, {
            method: 'GET',
            headers: {
                'accept': 'text/plain',
                'Authorization': `Bearer ${token}`,
            },
        });
        const data = await response.json();
        if (data.status && data.data) {
            return data.data;
        } else {
            throw new Error('Failed to fetch student details');
        }
    } catch (error) {
        console.error('Error fetching student details:', error);
        return null;
    }
};

const fetchJoinRequests = async (teamId: string, token: string) => {
    try {
        const response = await fetch(`https://smnc.site/api/TeamRequest/search?PageSize=10&TeamId=${teamId}`, {
            method: 'GET',
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${token}`,
            },
        });
        const data = await response.json();
        if (data.status && data.data) {
            const joinRequests = data.data.data.filter((request: JoinRequest) => request.type === "Join" && request.status === 0);
            return joinRequests;
        } else {
            throw new Error('Failed to fetch join requests');
        }
    } catch (error) {
        console.error('Error fetching join requests:', error);
        throw error;
    }
};

const declineMember = async (requestId: string, token: string) => {
    try {
        const response = await fetch(`https://smnc.site/api/TeamRequest/${requestId}`, {
            method: 'PUT',
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: requestId,
                comment: "Declined by the team leader",
                status: 2,
            }),
        });
        if (response.ok) {
            return true;
        } else {
            const errorData = await response.json();
            return false;
        }
    } catch (error) {
        console.error('Error declining member:', error);
        return false;
    }
};

const approveMember = async (request: DetailedJoinRequest, token: string, role: string) => {
    try {
        const response1 = await fetch(`https://smnc.site/api/TeamRequest/${request.id}`, {
            method: 'PUT',
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                id: request.id,
                comment: "Approved by the team leader",
                status: 1,
            }),
        });

        if (!response1.ok) {
            const errorData = await response1.json();
            throw new Error(errorData.message || 'Failed to approve request');
        }

        const response2 = await fetch('https://smnc.site/api/TeamMembers', {
            method: 'POST',
            headers: {
                'accept': '*/*',
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([{
                studentCode: request.studentCode,
                memberRole: role,
                note: role,
                isLeader: false,
                teamId: request.teamId,
            }]),
        });

        if (!response2.ok) {
            const errorData = await response2.json();
            throw new Error(errorData.message || 'Failed to add team member');
        }

        return true;
    } catch (error) {
        console.error('Error approving member:', error);
        return false;
    }
};

const RequestListScreen = () => {
    const router = useRouter();
    const { teamId } = useLocalSearchParams(); // Assuming teamId is passed from the previous page

    const [detailedRequests, setDetailedRequests] = useState<DetailedJoinRequest[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [refresh, setRefresh] = useState<boolean>(false);
    const [showSkillsModal, setShowSkillsModal] = useState<boolean>(false);
    const [showConfirmDeclineModal, setShowConfirmDeclineModal] = useState<boolean>(false);
    const [showConfirmApproveModal, setShowConfirmApproveModal] = useState<boolean>(false);
    const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
    const [visibleOptions, setVisibleOptions] = useState<{ [key: number]: boolean }>({});
    const [selectedRequestIndex, setSelectedRequestIndex] = useState<number | null>(null);
    const [role, setRole] = useState<string>('');

    const loadStudentDetails = async () => {
        try {
            const token = await AsyncStorage.getItem('@userToken');
            if (token) {
                const joinRequests = await fetchJoinRequests(typeof teamId === 'string' ? teamId : teamId[0], token);
                await AsyncStorage.removeItem('@requestCount');
                await AsyncStorage.setItem('@requestCount', JSON.stringify(joinRequests.length));
                // console.log(joinRequests.length);
                const updatedRequests = await Promise.all(
                    joinRequests.map(async (request: JoinRequest) => {
                        const studentDetails = await fetchStudentDetails(request.senderId, token);
                        if (studentDetails) {
                            return {
                                ...request,
                                studentName: studentDetails.studentName,
                                studentCode: studentDetails.studentCode,
                                studentDepartment: studentDetails.studentDepartment,
                                campus: studentDetails.campus,
                                phoneNumber: studentDetails.phoneNumber,
                                skills: studentDetails.skills,
                                studentLecturers: studentDetails.studentLecturers,
                            };
                        }
                        return undefined;
                    })
                );
                setDetailedRequests(updatedRequests.filter(request => request !== undefined) as DetailedJoinRequest[]);
            } else {
                console.log('Token not found');
            }
        } catch (error) {
            console.error('Error loading student details:', error);
        } finally {
            setLoading(false);
        }
    };
    

    const refreshPage = () => {
        setLoading(true);
        loadStudentDetails();
    };

    useEffect(() => {
        loadStudentDetails();
    }, [teamId]);

    const handleShowSkills = (skills: Skill[]) => {
        const filteredSkills = skills.filter(skill => !skill.isDeleted);
        setSelectedSkills(filteredSkills);
        setShowSkillsModal(true);
    };

    const confirmDeclineMember = (index: number) => {
        setSelectedRequestIndex(index);
        setShowConfirmDeclineModal(true);
    };

    const handleDeclineMember = async () => {
        if (selectedRequestIndex !== null) {
            const request = detailedRequests[selectedRequestIndex];
            const token = await AsyncStorage.getItem('@userToken');
            if (token && request) {
                const success = await declineMember(request.id, token);
                if (success) {
                    Alert.alert('Success', 'Member declined successfully');
                    refreshPage(); // Trigger a refresh without directly calling loadStudentDetails
                } else {
                    Alert.alert('Error', 'Failed to decline the member');
                }
            } else {
                Alert.alert('Error', 'Token or request not found');
            }
            setShowConfirmDeclineModal(false);
        }
    };

    const confirmApproveMember = (index: number) => {
        setSelectedRequestIndex(index);
        setShowConfirmApproveModal(true);
    };

    const handleApproveMember = async () => {
        if (selectedRequestIndex !== null && role.trim()) {
            const request = detailedRequests[selectedRequestIndex];
            const token = await AsyncStorage.getItem('@userToken');
            if (token && request) {
                const success = await approveMember(request, token, role);
                if (success) {
                    Alert.alert('Success', 'Member approved and added successfully');
                    refreshPage(); // Trigger a refresh without directly calling loadStudentDetails
                } else {
                    Alert.alert('Error', 'Failed to approve the member');
                }
            } else {
                Alert.alert('Error', 'Token or request not found');
            }
            setShowConfirmApproveModal(false);
        } else {
            Alert.alert('Input Required', 'Please enter a member role');
        }
    };

    const toggleOptions = (index: number) => {
             setVisibleOptions((prevVisibleOptions) => ({
            ...prevVisibleOptions,
            [index]: !prevVisibleOptions[index],
        }));
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerText}>Join Requests</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scrollView}>
                {detailedRequests.length > 0 ? (
                    detailedRequests.map((request, index) => (
                        <View key={index} style={styles.requestCard}>
                            <View style={styles.cardHeader}>
                                <Text>Sender Name: {request.studentName}</Text>
                                <TouchableOpacity
                                    style={styles.optionsButton}
                                    onPress={() => toggleOptions(index)}>
                                    <Text style={styles.optionsButtonText}>...</Text>
                                </TouchableOpacity>
                                {visibleOptions[index] && (
                                    <View style={styles.optionsContainer}>
                                        <TouchableOpacity onPress={() => confirmApproveMember(index)}>
                                            <Text style={styles.optionText}>Approve Member</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => confirmDeclineMember(index)}>
                                            <Text style={styles.optionText}>Decline Member</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                            <Text>Sender Code: {request.studentCode}</Text>
                            <Text>Sender Department: {request.studentDepartment}</Text>
                            <Text>Campus: {request.campus}</Text>
                            <Text>Created Date: {new Date(request.createdDate).toLocaleString()}</Text>
                            <Text>Comment: {request.comment}</Text>
                            <TouchableOpacity style={styles.skillButton} onPress={() => handleShowSkills(request.skills)}>
                                <Text style={styles.skillButtonText}>Skill Details</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <Text style={styles.noRequestsText}>No join requests found</Text>
                )}
            </ScrollView>

            <Modal visible={showSkillsModal} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <ScrollView>
                            {selectedSkills.length > 0 ? (
                                selectedSkills.map((skill, index) => (
                                    <View key={index} style={styles.skillCard}>
                                        <Text>Skill Name: {skill.skillName}</Text>
                                        <Text>Skill Description: {skill.skillDescription}</Text>
                                        <Text>Skill Type: {skill.skillType}</Text>
                                        <Text>Skill Level: {skill.skillLevel}</Text>
                                    </View>
                                ))
                            ) : (
                                <Text style={styles.noSkillsText}>No skills found</Text>
                            )}
                        </ScrollView>
                        <TouchableOpacity style={styles.closeButton} onPress={() => setShowSkillsModal(false)}>
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal visible={showConfirmDeclineModal} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text>Do you want to decline this member request?</Text>
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleDeclineMember}>
                                <Text style={styles.confirmButtonText}>Yes</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmDeclineModal(false)}>
                                <Text style={styles.cancelButtonText}>No</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showConfirmApproveModal} animationType="slide" transparent={true}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text>Enter the role for the new member:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter member role"
                            value={role}
                            onChangeText={setRole}
                        />
                        <View style={styles.modalButtonContainer}>
                            <TouchableOpacity style={styles.confirmButton} onPress={handleApproveMember}>
                                <Text style={styles.confirmButtonText}>Approve</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowConfirmApproveModal(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
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
    scrollView: {
        flexGrow: 1,
        padding: 16,
    },
    requestCard: {
        padding: 16,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 8,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionsButton: {
        padding: 5,
        backgroundColor: '#ccc',
        borderRadius: 5,
    },
    optionsButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    optionsContainer: {
        position: 'absolute',
        top: 40,
        right: 0,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        zIndex: 1,
    },
    optionText: {
        padding: 5,
        fontSize: 16,
    },
    skillButton: {
        backgroundColor: '#00796b',
        padding: 10,
        borderRadius: 5,
        marginTop: 10,
        alignItems: 'center',
    },
    skillButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
    },
    skillCard: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        marginBottom: 10,
    },
    noSkillsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    closeButton: {
        backgroundColor: '#003366',
        padding: 10,
        borderRadius: 5,
        marginTop: 20,
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    confirmButton: {
        backgroundColor: '#00796b',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#d9534f',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginLeft: 10,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    input: {
        height: 40,
        borderColor: '#ccc',
        borderWidth: 1,
        marginBottom: 20,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    noRequestsText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
        color: '#666',
    },
});

export default RequestListScreen;

