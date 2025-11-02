// import { useEffect, useState } from "react";
// import { authUtils } from "../../utils/authUtils";
// import { UpdateUserPayload, User } from "../../shared/types/User";
// import {
//   getUserByName,
//   topUp,
//   updateUserProfile,
// } from "../../controller/userController";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   AlertTriangle,
//   Camera,
//   Check,
//   PencilLine,
//   Plus,
//   Search,
//   Star,
//   UserPlus,
//   X,
// } from "lucide-react";
// import Modal from "../modals/ModalTemplate";
// import { JobCategory } from "../../shared/types/Job";
// import { useJobCategories } from "../../utils/useJobCategories";
// import LoadingOverlay from "../ui/loading-animation";
// import ErrorModal from "../modals/ErrorModal";
// import FaceRecognition from "../FaceRecognition";

// export default function ProfileBiodata() {
//   const [user, setUser] = useState<User | null>(null);
//   const [username, setUsername] = useState<string>("");
//   const [description, setDescription] = useState<string>("");
//   const [tempUsername, setTempUsername] = useState<string>("");
//   const [tempDescription, setTempDescription] = useState<string>("");
//   const [selectedImage, setSelectedImage] = useState<File | null>(null);
//   const [previewImage, setPreviewImage] = useState<string | null>(null);
//   const [faceRecognitionOn, setFaceRecognitionOn] = useState(false);
//   const [hasChanges, setHasChanges] = useState<boolean>(false);
//   const [showImagePreview, setShowImagePreview] = useState<boolean>(false);
//   const [errors, setErrors] = useState<string>("");
//   const { current_user } = authUtils();
//   const [dob, setDob] = useState("");
//   const [tempDob, setTempDob] = useState<string>("");

//   const [, setPrincipalId] = useState<string | null>(null);
//   const [, setIsConnected] = useState(false);
//   const [amount, setAmount] = useState("");

//   const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
//   const [selectedCategories, setSelectedCategories] = useState(
//     user?.preference || []
//   );
//   const [tempSelectedCategories, setTempSelectedCategories] = useState(
//     user?.preference || []
//   );
//   const [searchTerm, setSearchTerm] = useState("");
//   const { data, loading, error, refresh } = useJobCategories();
//   const [dataLoading, setLoading] = useState(false);

//   useEffect(() => {
//     const connectPlugWallet = async () => {
//       try {
//         const plug = (window as any).ic?.plug; // Typecasting window.ic

//         if (!plug) {
//           console.error("Plug Wallet not detected");
//           alert(
//             "Plug Wallet is not installed. Please install it at https://chromewebstore.google.com/detail/plug/cfbfdhimifdmdehjmkdobpcjfefblkjm?pli=1."
//           );
//           return;
//         }

//         const connected = await plug.isConnected();
//         if (!connected) {
//           await plug.requestConnect({
//             whitelist: ["ryjl3-tyaaa-aaaaa-aaaba-cai"],
//             host: "https://localhost:3000",
//           });
//         }

//         const principal = await plug.getPrincipal();
//         setPrincipalId(principal.toString());
//         setIsConnected(true);
//       } catch (error) {
//         console.error("Plug Wallet connection error:", error);
//       }
//     };

//     connectPlugWallet();
//   }, []);

//   const blobToUint8Array = async (blob: Blob): Promise<Uint8Array> => {
//     const arrayBuffer = await blob.arrayBuffer();
//     return new Uint8Array(arrayBuffer);
//   };

//   const sendICP = async () => {
    
//     try {
//       const plug = (window as any).ic?.plug;

//       if (!plug) {
//         alert("Plug Wallet not detected");
//         return;
//       }
      
//       const connected = await plug.isConnected();
//       if (!connected) {
//         await plug.requestConnect();
//       }
//       const transferArgs = {
//         to: "Ergasia",
//         amount: parseFloat(amount) * 100000000, // 8 decimals for ICP
//         token: {
//           symbol: "ICP",
//           standard: "ICP",
//           decimals: 8,
//           price: true,
//         },
//       };
//       console.log("kanjut")
//       console.log("Sending ICP:", transferArgs);
//       const result = await plug.requestTransfer(transferArgs);
//       console.log("kanjut")
//       console.log("Transaction successful:", result);
//       topUp(parseFloat(amount));
//       //later add success modal

//       if (current_user) {
//         const parsedUser = JSON.parse(current_user).ok;
//         // let imageData: Uint8Array | null = null;
//         const profilePicture = await blobToUint8Array(
//           user?.profilePicture || new Blob()
//         );
//         console.log("memememe" + profilePicture);
//         localStorage.setItem(
//           "current_user",
//           JSON.stringify({
//             ok: {
//               ...user,
//               wallet: parsedUser.wallet + parseFloat(amount),
//               profilePicture: profilePicture,
//             },
//           })
//         );
//       }
//       window.location.reload();
//     } catch (error) {
//       console.error("Payment error:", error);
//       alert("Payment failed!");
//     }
//   };

//   const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.files?.[0]) {
//       const file = event.target.files[0];
//       console.log(file);
//       setSelectedImage(file);
//       setPreviewImage(URL.createObjectURL(file));
//       setShowImagePreview(true);
//     }
//   };
//   useEffect(() => {
//     const changesExist =
//       tempUsername !== username ||
//       tempDescription !== description ||
//       tempDob !== dob ||
//       selectedImage !== null ||
//       JSON.stringify(tempSelectedCategories) !==
//         JSON.stringify(selectedCategories);

//     setHasChanges(changesExist);
//   }, [
//     tempUsername,
//     tempDescription,
//     tempDob,
//     selectedImage,
//     tempSelectedCategories,
//   ]);

//   const removeCategory = (category: JobCategory) => {
//     setTempSelectedCategories(
//       tempSelectedCategories.filter((cat) => cat !== category)
//     );
//   };

//   // Filter categories based on search term
//   const filteredCategories = (data || [])
//     .filter((category) =>
//       category.jobCategoryName.toLowerCase().includes(searchTerm.toLowerCase())
//     )
//     .slice(0, 10);
//   const saveCategories = () => {
//     setSelectedCategories(tempSelectedCategories);
//     setIsCategoryModalOpen(false);
//   };

//   useEffect(() => {
//     if (current_user) {
//       const newUser = JSON.parse(current_user).ok;
//       const profile = newUser.profilePicture;

//       if (profile) {
//         const u8 = new Uint8Array(Object.values(profile));
//         const blob = new Blob([u8], { type: "image/png" });
//         newUser.profilePicture = blob;
//       }
//       setUser(newUser);
//       setUsername(newUser.username);
//       setDescription(newUser.description);
//       setDob(newUser.dob);
//       setTempUsername(newUser.username);
//       setTempDescription(newUser.description);
//       setTempDob(newUser.dob);
//       setPreviewImage(URL.createObjectURL(newUser.profilePicture));
//       setTempSelectedCategories(newUser.preference);
//       setSelectedCategories(newUser.preference);
//     }
//   }, [current_user]);

//   const ProfileImageModal = () => (
//     <Modal
//       isOpen={showImagePreview}
//       onClose={() => setShowImagePreview(false)}
//       title="Profile Picture Preview"
//     >
//       <div className="space-y-6 text-center">
//         <div className="relative mx-auto w-48 h-48">
//           <img
//             src={previewImage || ""}
//             className="w-full h-full rounded-full border-4 border-white shadow-lg"
//             alt="Preview"
//           />
//         </div>
//         <div className="flex gap-4 justify-center">
//           <button
//             onClick={() => {
//               setShowImagePreview(false);
//               setPreviewImage(previewImage);
//             }}
//             className="px-4 py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg flex items-center gap-2 hover:shadow-md transition-all"
//           >
//             <Check size={20} /> Confirm
//           </button>
//           <button
//             onClick={() => {
//               setSelectedImage(null);
//               setPreviewImage(null);
//               setShowImagePreview(false);
//             }}
//             className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg flex items-center gap-2 hover:shadow-md transition-all"
//           >
//             <X size={20} /> Cancel
//           </button>
//         </div>
//       </div>
//     </Modal>
//   );

//   const convertImageToBlob = async (file: File): Promise<Blob> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.onload = () => {
//         if (reader.result instanceof ArrayBuffer) {
//           const blob = new Blob([reader.result], { type: file.type });
//           resolve(blob);
//         } else {
//           reject(new Error("Failed to convert image to blob"));
//         }
//       };
//       reader.onerror = () => reject(reader.error);
//       reader.readAsArrayBuffer(file);
//     });
//   };

//   const handleSave = async () => {
//     if (!tempUsername.trim()) {
//       setErrors("Username cannot be empty");
//       return;
//     }
//     if (!/^[a-zA-Z0-9]+$/.test(tempUsername)) {
//       setErrors("Username can only contain alphanumeric characters");
//       return;
//     }
//     // also add validation if username already taken

//     setLoading(true);
//     const usernameTaken = await getUserByName(tempUsername);
//     if (usernameTaken && tempUsername !== user?.username) {
//       setErrors("Username already taken");
//       setLoading(false);
//       return;
//     }

//     try {
//       let imageData: Uint8Array | null = null;

//       if (selectedImage) {
//         const imageBlob = await convertImageToBlob(selectedImage);
//         imageData = await blobToUint8Array(imageBlob);
//       } else {
//         imageData = await blobToUint8Array(
//           user?.profilePicture || new Blob()
//         );
//       }

//       const formattedPayload: UpdateUserPayload = {
//           username: tempUsername ? tempUsername : '',
//           profilePicture: imageData ? imageData : [],
//           description: tempDescription ? tempDescription : '',
//           dob: tempDob ? tempDob : '',
//           isFaceRecognitionOn: faceRecognitionOn ? true : false,
//           preference: tempSelectedCategories,
//           isProfileCompleted: user?.isProfileCompleted,
//       };

//       await updateUserProfile(formattedPayload);

//       localStorage.setItem(
//         "current_user",
//         JSON.stringify({
//           ok: {
//             ...user,
//             profilePicture: imageData,
//             username: tempUsername,
//             description: tempDescription,
//             dob: tempDob,
//             preference: tempSelectedCategories,
//           },
//         })
//       );
//       setPreviewImage(
//           URL.createObjectURL(
//               new Blob(imageData, { type: 'image/png' })
//           )
//       );
//       setErrors("");
//       setHasChanges(false);

//       setTempSelectedCategories(selectedCategories);
//       setUsername(tempUsername);
//       setDescription(tempDescription);
//       setDob(tempDob);
//       setTempUsername(tempUsername);
//       setTempDescription(tempDescription);
//       setTempDob(tempDob);
//       refresh();
//       setLoading(false);
//     } catch (err) {
//       console.error("Error saving profile:", err);
//     }
//   };

//   const handleCancel = () => {
//     setTempUsername(username);
//     setTempDescription(description);
//     setSelectedImage(null);
//     setPreviewImage(null);
//   };

//   const handleToggle = () => {
//     setFaceRecognitionOn((prev) => !prev);
//   };

//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const handleCategorySelection = (category: JobCategory) => {
//     if (tempSelectedCategories.includes(category)) {
//       setTempSelectedCategories(
//         tempSelectedCategories.filter((cat) => cat !== category)
//       );
//     } else {
//       if (tempSelectedCategories.length < 3) {
//         setTempSelectedCategories([...tempSelectedCategories, category]);
//       }
//     }
//   };
//   return (
//     <div className="w-full">
//       {dataLoading && <LoadingOverlay message="Loading..." />}{" "}
//       {errors !== "" && !dataLoading && (
//         <ErrorModal
//           isOpen={errors !== ""}
//           onClose={() => setErrors("")}
//           message={errors}
//           duration={2000}
//         />
//       )}
//       {user && (
//         <>
//           <AnimatePresence>
//             {hasChanges && (
//               <motion.div
//                 initial={{ y: 20, opacity: 0 }}
//                 animate={{ y: 0, opacity: 1 }}
//                 exit={{ y: 20, opacity: 0 }}
//                 className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl p-4 flex gap-4 items-center z-40 border border-purple-100"
//               >
//                 <span className="text-purple-700 font-semibold">
//                   Unsaved changes detected
//                 </span>
//                 <button
//                   onClick={handleSave}
//                   className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:scale-[1.02] transition-transform flex items-center gap-2 shadow-lg"
//                 >
//                   <Check size={18} /> Save Changes
//                 </button>
//                 <button
//                   onClick={handleCancel}
//                   className="px-4 py-2 bg-white border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50 transition-all flex items-center gap-2"
//                 >
//                   <X size={18} /> Discard
//                 </button>
//               </motion.div>
//             )}
//           </AnimatePresence>

//           <ProfileImageModal />

//           <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-50">
//             {/* Profile Header */}
//             <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 p-8">
//               <div className="flex items-center gap-6">
//                 <motion.div
//                   whileHover={{ scale: 1.05 }}
//                   className="relative group"
//                 >
//                   <label className="cursor-pointer">
//                     <input
//                       type="file"
//                       accept="image/*"
//                       onChange={handleImageChange}
//                       className="hidden"
//                     />
//                     <div className="relative w-48 h-48 rounded-full border-4 border-white/90 shadow-2xl overflow-hidden">
//                       <img
//                         src={
//                           previewImage ||
//                           (user.profilePicture
//                             ? URL.createObjectURL(user.profilePicture)
//                             : "/default-avatar.png")
//                         }
//                         className="w-full h-full object-cover"
//                         alt="Profile"
//                       />
//                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
//                         <Camera
//                           className="text-white w-8 h-8"
//                           strokeWidth={1.5}
//                         />
//                       </div>
//                     </div>
//                   </label>
//                 </motion.div>

//                 <div className="space-y-2 flex-1">
//                   <div className="flex justify-between items-center">
//                     <label htmlFor="username" className="relative">
//                       <input
//                         value={tempUsername}
//                         onChange={(e) => setTempUsername(e.target.value)}
//                         autoComplete="off"
//                         className="text-4xl font-bold bg-transparent focus:outline-0 border-b border-purple-400 focus:border-black text-black placeholder:text-gray-400 w-full"
//                         placeholder="Enter username"
//                         name="username"
//                       />
//                       <PencilLine className="absolute top-2 right-4" />
//                     </label>

//                     {/* Rating moved to header area */}
//                     <div className="flex items-center gap-2 bg-white/80 p-3 rounded-xl shadow-md">
//                       <div className="flex text-yellow-400">
//                         {[...Array(5)].map((_, i) => (
//                           <Star
//                             key={i}
//                             className={`w-5 h-5 ${
//                               i < (user?.rating || 0)
//                                 ? "fill-current"
//                                 : "fill-purple-100"
//                             }`}
//                           />
//                         ))}
//                       </div>
//                       <span className="text-lg font-bold text-purple-900">
//                         {user?.rating?.toFixed(1) || "4.8"}
//                       </span>
//                     </div>
//                   </div>

//                   {/* Category Preferences as tags */}
//                   <div className="mt-4 flex flex-wrap items-center gap-2">
//                     {tempSelectedCategories.length > 0
//                       ? tempSelectedCategories.map((category) => (
//                           <motion.div
//                             key={category.id}
//                             initial={{ scale: 0.9 }}
//                             animate={{ scale: 1 }}
//                             className="bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium border border-purple-100 flex items-center gap-1 shadow-sm"
//                           >
//                             {category.jobCategoryName}
//                             <X
//                               className="w-4 h-4 cursor-pointer hover:text-purple-900"
//                               onClick={() => removeCategory(category)}
//                             />
//                           </motion.div>
//                         ))
//                       : null}

//                     <motion.button
//                       whileHover={{ scale: 1.05 }}
//                       whileTap={{ scale: 0.95 }}
//                       onClick={() => setIsCategoryModalOpen(true)}
//                       className="bg-white/80 text-purple-600 hover:text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 border border-purple-200 shadow-sm"
//                     >
//                       <Plus className="w-4 h-4" />
//                       {tempSelectedCategories.length === 0
//                         ? "Add categories"
//                         : "Edit"}
//                     </motion.button>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Biodata Content */}
//             <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
//               {/* Left Column */}
//               <div className="space-y-6">
//                 <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-lg">
//                   <label className="block text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3">
//                     Date of Birth
//                   </label>
//                   <input
//                     type="date"
//                     value={tempDob}
//                     onChange={(e) => setTempDob(e.target.value)}
//                     className="w-full p-3 border-2 border-purple-100 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-purple-900 font-medium"
//                   />
//                 </div>

//                 <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-lg">
//                   <label className="block text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3">
//                     Description
//                   </label>
//                   <textarea
//                     value={tempDescription}
//                     onChange={(e) => setTempDescription(e.target.value)}
//                     className="w-full p-3 border-2 border-purple-100 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200 h-32 text-purple-900 font-medium"
//                     placeholder="Tell us about yourself..."
//                   />
//                 </div>

//                 <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-lg">
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm font-semibold text-purple-600 uppercase tracking-wide">
//                       Face Recognition
//                     </span>
//                     <button
//                       onClick={handleToggle}
//                       className={`w-14 h-8 rounded-full p-1 transition-colors ${
//                         faceRecognitionOn ? "bg-purple-600" : "bg-purple-100"
//                       }`}
//                     >
//                       <motion.div
//                         className="w-6 h-6 rounded-full bg-white shadow-lg"
//                         animate={{ x: faceRecognitionOn ? 26 : 0 }}
//                         transition={{ type: "spring", stiffness: 500 }}
//                       />
//                     </button>
//                     {/* register button for face recognition */}
//                     <button
//                       onClick={() => setIsModalOpen(true)}
//                       className="flex items-center space-x-2 bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
//                     >
//                       <UserPlus className="w-5 h-5" />
//                       <span>Register</span>
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* Right Column */}
//               <div className="space-y-6">
//                 <div className="bg-white p-6 rounded-xl border border-purple-100 shadow-lg">
//                   <h3 className="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-3">
//                     Wallet Balance
//                   </h3>
//                   <p className="text-3xl font-bold text-purple-900">
//                     ${user?.wallet?.toFixed(2) || "0.00"}
//                   </p>

//                   <button
//                     className="mt-4 w-full bg-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-purple-700 transition"
//                     onClick={() => setIsModalOpen(true)}
//                   >
//                     Top Up
//                   </button>

//                   {isModalOpen && (
//                     <div className="fixed inset-0 flex items-center justify-center bg-white/30 backdrop-blur-md z-50">
//                       <div className="bg-white p-6 rounded-lg shadow-lg w-96">
//                         <h2 className="text-lg font-semibold text-purple-700 mb-4">
//                           Enter Token Amount
//                         </h2>
//                         <input
//                           type="number"
//                           value={amount}
//                           onChange={(e) => setAmount(e.target.value)}
//                           placeholder="Enter amount"
//                           className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-600 focus:outline-none"
//                         />
//                         <div className="mt-4 flex justify-end">
//                           <button
//                             className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg mr-2"
//                             onClick={() => setIsModalOpen(false)}
//                           >
//                             Cancel
//                           </button>
//                           <button
//                             className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
//                             onClick={sendICP}
//                           >
//                             Confirm
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <FaceRecognition
//               principalId={user.id || ""}
//               onSuccess={() => {
//                 console.log("Operation successful!");
//                 setIsModalOpen(false);
//               }}
//               onError={(error: string) =>
//                 console.error("Operation failed:", error)
//               }
//               mode="register"
//               isOpen={isModalOpen}
//               onClose={() => setIsModalOpen(false)}
//             />

//             {/* Category Selection Modal */}
//             {isCategoryModalOpen && (
//               <div className="fixed inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-50">
//                 <motion.div
//                   initial={{ opacity: 0, scale: 0.95 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md"
//                 >
//                   <div className="flex justify-between items-center mb-4">
//                     <h3 className="text-lg font-bold text-purple-800">
//                       Select Categories
//                       <span className="ml-2 text-sm font-normal text-purple-500">
//                         (Max 3)
//                       </span>
//                     </h3>
//                     <button
//                       onClick={() => setIsCategoryModalOpen(false)}
//                       className="text-gray-500 hover:text-gray-800"
//                     >
//                       <X className="w-5 h-5" />
//                     </button>
//                   </div>

//                   {/* Search input */}
//                   <div className="relative mb-4">
//                     <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
//                     <input
//                       type="text"
//                       value={searchTerm}
//                       onChange={(e) => setSearchTerm(e.target.value)}
//                       placeholder="Search categories..."
//                       className="w-full pl-10 pr-4 py-2 border-2 border-purple-100 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
//                     />
//                   </div>

//                   {/* Selected categories */}
//                   {tempSelectedCategories.length > 0 && (
//                     <div className="mb-4">
//                       <p className="text-sm text-purple-600 mb-2">Selected:</p>
//                       <div className="flex flex-wrap gap-2">
//                         {tempSelectedCategories.map((category) => (
//                           <div
//                             key={category.id}
//                             className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
//                           >
//                             {category.jobCategoryName}
//                             <X
//                               className="w-4 h-4 cursor-pointer hover:text-purple-900"
//                               onClick={() => removeCategory(category)}
//                             />
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}

//                   {/* Category list */}
//                   <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
//                     {filteredCategories.length > 0 ? (
//                       filteredCategories.map((category) => (
//                         <motion.div
//                           key={category.id}
//                           whileHover={{ scale: 1.01 }}
//                           whileTap={{ scale: 0.99 }}
//                           onClick={() => handleCategorySelection(category)}
//                           className={`cursor-pointer p-3 rounded-lg flex items-center justify-between ${
//                             tempSelectedCategories.some(
//                               (cat) => cat.id === category.id
//                             )
//                               ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white"
//                               : "bg-purple-50 text-purple-700 hover:bg-purple-100"
//                           }`}
//                         >
//                           <span className="font-medium">
//                             {category.jobCategoryName}
//                           </span>
//                           {tempSelectedCategories.some(
//                             (cat) => cat.id === category.id
//                           ) && <Check className="w-5 h-5" />}
//                         </motion.div>
//                       ))
//                     ) : (
//                       <p className="text-center py-4 text-gray-500">
//                         {searchTerm
//                           ? "No matching categories found"
//                           : "Loading categories..."}
//                       </p>
//                     )}
//                   </div>

//                   {tempSelectedCategories.length === 3 && (
//                     <p className="mt-3 text-sm text-yellow-600 flex items-center justify-center">
//                       <span className="mr-1">
//                         <AlertTriangle />
//                       </span>{" "}
//                       Maximum selection reached (3)
//                     </p>
//                   )}

//                   <div className="mt-6 flex justify-end gap-3">
//                     <button
//                       onClick={() => setIsCategoryModalOpen(false)}
//                       className="px-4 py-2 text-purple-700 border border-purple-300 rounded-lg hover:bg-purple-50"
//                     >
//                       Cancel
//                     </button>
//                     <button
//                       onClick={saveCategories}
//                       className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700"
//                     >
//                       Save
//                     </button>
//                   </div>
//                 </motion.div>
//               </div>
//             )}
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
