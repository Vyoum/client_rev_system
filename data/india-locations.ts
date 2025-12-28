export type LocationState = {
  state: string
  cities: string[]
}

export const INDIA_LOCATIONS: LocationState[] = [
  { 
    state: "Andhra Pradesh", 
    cities: ["Amaravati", "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Rajahmundry", "Tirupati", "Kurnool", "Kakinada", "Anantapur", "Eluru", "Kadapa", "Ongole", "Chittoor", "Machilipatnam"] 
  },
  { 
    state: "Arunachal Pradesh", 
    cities: ["Itanagar", "Tawang", "Pasighat", "Naharlagun", "Bomdila", "Ziro", "Tezu", "Along", "Khonsa", "Roing", "Daporijo", "Yingkiong", "Seppa", "Changlang", "Longding"] 
  },
  { 
    state: "Assam", 
    cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Sivasagar", "Goalpara", "Barpeta", "Karimganj", "Hailakandi", "Dhubri", "Golaghat"] 
  },
  { 
    state: "Bihar", 
    cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Bihar Sharif", "Arrah", "Begusarai", "Katihar", "Munger", "Chapra", "Saharsa", "Hajipur", "Sitamarhi"] 
  },
  { 
    state: "Chhattisgarh", 
    cities: ["Raipur", "Bilaspur", "Durg", "Bhilai", "Korba", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari", "Mahasamund", "Kanker", "Janjgir", "Kawardha", "Surguja"] 
  },
  { 
    state: "Goa", 
    cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Valpoi", "Canacona", "Quepem", "Sanguem", "Pernem", "Siolim", "Aldona", "Calangute"] 
  },
  { 
    state: "Gujarat", 
    cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Anand", "Bharuch", "Junagadh", "Navsari", "Surendranagar", "Mehsana", "Gandhidham", "Valsad"] 
  },
  { 
    state: "Haryana", 
    cities: ["Gurugram", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Rewari"] 
  },
  { 
    state: "Himachal Pradesh", 
    cities: ["Shimla", "Dharamshala", "Manali", "Solan", "Mandi", "Palampur", "Kullu", "Chamba", "Bilaspur", "Una", "Hamirpur", "Kangra", "Nahan", "Parwanoo", "Kasauli"] 
  },
  { 
    state: "Jharkhand", 
    cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Medininagar", "Chaibasa", "Gumla", "Lohardaga", "Pakur", "Sahebganj", "Dumka"] 
  },
  { 
    state: "Karnataka", 
    cities: ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Kalaburagi", "Davangere", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru", "Raichur", "Bidar", "Hassan", "Udupi"] 
  },
  { 
    state: "Kerala", 
    cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Alappuzha", "Palakkad", "Kannur", "Kottayam", "Malappuram", "Thalassery", "Pathanamthitta", "Idukki", "Wayanad", "Kasargod"] 
  },
  { 
    state: "Madhya Pradesh", 
    cities: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Ratlam", "Satna", "Rewa", "Murwara", "Singrauli", "Burhanpur", "Neemuch", "Chhindwara", "Dewas"] 
  },
  { 
    state: "Maharashtra", 
    cities: ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur", "Thane", "Kalyan", "Vasai", "Navi Mumbai", "Sangli", "Kolhapur", "Amravati", "Nanded", "Jalgaon"] 
  },
  { 
    state: "Manipur", 
    cities: ["Imphal", "Thoubal", "Churachandpur", "Bishnupur", "Ukhrul", "Kakching", "Senapati", "Tamenglong", "Jiribam", "Kangpokpi", "Kamjong", "Noney", "Pherzawl", "Tengnoupal", "Chandel"] 
  },
  { 
    state: "Meghalaya", 
    cities: ["Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara", "Resubelpara", "Mairang", "Mawkyrwat", "Ampati", "Khliehriat", "Nongstoin", "Williamnagar", "Dadenggre", "Mendipathar", "Selsella"] 
  },
  { 
    state: "Mizoram", 
    cities: ["Aizawl", "Lunglei", "Champhai", "Saiha", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Khawzawl", "Hnahthial", "Saitual", "Khawbung", "Thenzawl", "Darlawn", "Vairengte"] 
  },
  { 
    state: "Nagaland", 
    cities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Mon", "Zunheboto", "Phek", "Kiphire", "Longleng", "Peren", "Noklak", "Tseminyu", "Chumukedima", "Medziphema"] 
  },
  { 
    state: "Odisha", 
    cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda", "Bargarh", "Jeypore", "Rayagada", "Angul", "Dhenkanal"] 
  },
  { 
    state: "Punjab", 
    cities: ["Amritsar", "Ludhiana", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Pathankot", "Moga", "Firozpur", "Sangrur", "Batala", "Malerkotla", "Abohar", "Phagwara"] 
  },
  { 
    state: "Rajasthan", 
    cities: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer", "Bhilwara", "Alwar", "Sikar", "Pali", "Chittorgarh", "Bharatpur", "Sri Ganganagar", "Hanumangarh", "Tonk"] 
  },
  { 
    state: "Sikkim", 
    cities: ["Gangtok", "Namchi", "Gyalshing", "Mangan", "Rangpo", "Jorethang", "Singtam", "Ravangla", "Pakyong", "Rhenock", "Chungthang", "Lachen", "Lachung", "Pelling", "Yuksom"] 
  },
  { 
    state: "Tamil Nadu", 
    cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Hosur", "Nagercoil", "Kanchipuram", "Kumbakonam"] 
  },
  { 
    state: "Telangana", 
    cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahabubnagar", "Nalgonda", "Siddipet", "Suryapet", "Miryalaguda", "Adilabad", "Jagtial", "Bhongir", "Wanaparthy"] 
  },
  { 
    state: "Tripura", 
    cities: ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia", "Khowai", "Teliamura", "Ambassa", "Sabroom", "Sonamura", "Kamalpur", "Amarpur", "Kumarghat", "Melaghar", "Jirania"] 
  },
  { 
    state: "Uttar Pradesh", 
    cities: ["Lucknow", "Kanpur", "Varanasi", "Agra", "Meerut", "Allahabad", "Ghaziabad", "Noida", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Firozabad", "Mathura"] 
  },
  { 
    state: "Uttarakhand", 
    cities: ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Kashipur", "Rudrapur", "Rishikesh", "Nainital", "Mussoorie", "Almora", "Pithoragarh", "Udham Singh Nagar", "Chamoli", "Pauri", "Tehri"] 
  },
  { 
    state: "West Bengal", 
    cities: ["Kolkata", "Siliguri", "Durgapur", "Asansol", "Howrah", "Kharagpur", "Bardhaman", "Malda", "Krishnanagar", "Jalpaiguri", "Raiganj", "Cooch Behar", "Balurghat", "Bankura", "Purulia"] 
  },
  { 
    state: "Andaman and Nicobar Islands", 
    cities: ["Port Blair", "Havelock Island", "Car Nicobar", "Diglipur", "Mayabunder", "Rangat", "Long Island", "Neil Island", "Baratang", "Little Andaman", "Middle Andaman", "North Andaman", "South Andaman", "Nicobar", "Nancowry"] 
  },
  { 
    state: "Chandigarh", 
    cities: ["Chandigarh", "Mohali", "Panchkula", "Zirakpur", "Kharar", "Dera Bassi", "Banur", "Kalka", "Pinjore", "Baddi", "Nalagarh", "Parwanoo", "Barwala", "Raipur Rani", "Morni"] 
  },
  { 
    state: "Dadra and Nagar Haveli and Daman and Diu", 
    cities: ["Silvassa", "Daman", "Diu", "Naroli", "Dadra", "Khanvel", "Vapi", "Masat", "Rakholi", "Amli", "Kadaiya", "Kherdi", "Kachigam", "Dabhel", "Bhimpore"] 
  },
  { 
    state: "Delhi", 
    cities: ["New Delhi", "Dwarka", "Rohini", "Noida", "Gurugram", "Faridabad", "Ghaziabad", "Greater Noida", "Noida Extension", "Indirapuram", "Vaishali", "Kaushambi", "Sector 62", "Sector 137", "Sector 150"] 
  },
  { 
    state: "Jammu and Kashmir", 
    cities: ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore", "Kathua", "Udhampur", "Rajouri", "Poonch", "Kupwara", "Bandipora", "Ganderbal", "Pulwama", "Shopian", "Kulgam"] 
  },
  { 
    state: "Ladakh", 
    cities: ["Leh", "Kargil", "Diskit", "Nubra", "Hemis", "Alchi", "Thiksey", "Shey", "Lamayuru", "Drass", "Zanskar", "Padum", "Rangdum", "Turtuk", "Hundar"] 
  },
  { 
    state: "Lakshadweep", 
    cities: ["Kavaratti", "Minicoy", "Agatti", "Andrott", "Amini", "Bitra", "Chetlat", "Kadmat", "Kalpeni", "Kiltan", "Kochi", "Bangaram", "Perumal Par", "Suheli", "Thinnakara"] 
  },
  { 
    state: "Puducherry", 
    cities: ["Puducherry", "Karaikal", "Mahe", "Yanam", "Ozhukarai", "Villianur", "Bahour", "Nettapakkam", "Ariyankuppam", "Muthialpet", "Reddiarpalayam", "Muthirapalayam", "Kurumbapet", "Thavalakuppam", "Mangalam"] 
  },
]
