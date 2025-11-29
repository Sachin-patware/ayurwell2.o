// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import PatientLayout from '@/components/layouts/PatientLayout';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Info, Calendar, User } from 'lucide-react';
// import api from '@/services/api';

// export default function AssessmentPage() {
//     const router = useRouter();
//     const { user } = useAuth();
//     const [patient, setPatient] = useState<any>(null);
//     const [loading, setLoading] = useState(true);

//     useEffect(() => {
//         const fetchPatient = async () => {
//             try {
//                 // Assuming the user.uid is the patientId or we can get it from /auth/me if needed
//                 // But for now let's try to get the current patient's profile
//                 // The /patients endpoint with GET might return list, but /patients/<id> returns one.
//                 // If we don't have ID, we might need to rely on the backend to give us "my" profile.
//                 // Let's assume user.uid is the patientId for now as per User model.
//                 if (user?.uid) {
//                     const response = await api.get(`/patients/${user.uid}`);
//                     setPatient(response.data);
//                 }
//             } catch (error) {
//                 console.error('Error fetching patient:', error);
//             } finally {
//                 setLoading(false);
//             }
//         };

//         if (user) {
//             fetchPatient();
//         }
//     }, [user]);

//     if (loading) {
//         return (
//             <PatientLayout>
//                 <div className="flex justify-center items-center h-64">
//                     <p>Loading assessment...</p>
//                 </div>
//             </PatientLayout>
//         );
//     }

//     return (
//         <PatientLayout>
//             <div className="max-w-2xl mx-auto space-y-6">
//                 <div>
//                     <h2 className="text-3xl font-bold text-gray-900">Health Assessment</h2>
//                     <p className="text-gray-500 mt-1">
//                         Your Ayurvedic constitution and health profile.
//                     </p>
//                 </div>

//                 {patient?.assessment?.prakriti ? (
//                     <div className="space-y-6">
//                         <Card>
//                             <CardHeader>
//                                 <CardTitle>Your Constitution</CardTitle>
//                             </CardHeader>
//                             <CardContent className="space-y-6">
//                                 <div className="grid grid-cols-2 gap-4">
//                                     <div className="bg-green-50 p-4 rounded-lg text-center">
//                                         <h3 className="text-sm font-medium text-green-800 mb-1">Prakriti</h3>
//                                         <p className="text-2xl font-bold text-green-900">{patient.assessment.prakriti}</p>
//                                     </div>
//                                     <div className="bg-orange-50 p-4 rounded-lg text-center">
//                                         <h3 className="text-sm font-medium text-orange-800 mb-1">Vikriti</h3>
//                                         <p className="text-2xl font-bold text-orange-900">{patient.assessment.vikriti || 'None'}</p>
//                                     </div>
//                                 </div>

//                                 <div className="grid grid-cols-2 gap-4 text-sm">
//                                     <div className="flex justify-between border-b pb-2">
//                                         <span className="text-gray-500">Age</span>
//                                         <span className="font-medium">{patient.assessment.age}</span>
//                                     </div>
//                                     <div className="flex justify-between border-b pb-2">
//                                         <span className="text-gray-500">Gender</span>
//                                         <span className="font-medium">{patient.assessment.gender}</span>
//                                     </div>
//                                 </div>
//                             </CardContent>
//                         </Card>

//                         {patient.assessmentDoctorName && (
//                             <Card className="bg-blue-50 border-blue-100">
//                                 <CardContent className="pt-6">
//                                     <div className="flex items-start gap-4">
//                                         <div className="bg-blue-100 p-2 rounded-full">
//                                             <User className="h-5 w-5 text-blue-600" />
//                                         </div>
//                                         <div>
//                                             <h3 className="font-semibold text-blue-900">Assessment Verified</h3>
//                                             <p className="text-blue-700 text-sm mt-1">
//                                                 This assessment was conducted by <strong>Dr. {patient.assessmentDoctorName}</strong>
//                                                 {patient.assessmentCreatedAt && (
//                                                     <span> on {new Date(patient.assessmentCreatedAt).toLocaleDateString()}</span>
//                                                 )}.
//                                             </p>
//                                         </div>
//                                     </div>
//                                 </CardContent>
//                             </Card>
//                         )}
//                     </div>
//                 ) : (
//                     <Card>
//                         <CardContent className="pt-6">
//                             <div className="text-center py-8">
//                                 <div className="bg-blue-50 p-4 rounded-full inline-flex mb-4">
//                                     <Info className="h-8 w-8 text-blue-600" />
//                                 </div>
//                                 <h3 className="text-xl font-semibold text-gray-900 mb-2">
//                                     Assessment Pending
//                                 </h3>
//                                 <p className="text-gray-600 max-w-md mx-auto mb-6">
//                                     Your health assessment (Prakriti & Vikriti analysis) must be completed in consultation with your Ayurvedic practitioner. Please schedule an appointment or visit your doctor to update this information.
//                                 </p>
//                                 <Button
//                                     onClick={() => router.push('/patient/dashboard')}
//                                     className="bg-[#2E7D32] hover:bg-[#1B5E20]"
//                                 >
//                                     Back to Dashboard
//                                 </Button>
//                             </div>
//                         </CardContent>
//                     </Card>
//                 )}
//             </div>
//         </PatientLayout>
//     );
// }
