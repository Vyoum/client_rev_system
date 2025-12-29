export type IndiaCourse = {
  courseName: string
  courseField: string
}

// Curated list of common courses/degrees in India (not exhaustive).
export const INDIA_COURSES: IndiaCourse[] = [
  // Management & Business
  { courseName: "MBA", courseField: "Management" },
  { courseName: "Executive MBA", courseField: "Management" },
  { courseName: "PGDM", courseField: "Management" },
  { courseName: "BBA", courseField: "Management" },
  { courseName: "BBM", courseField: "Management" },
  { courseName: "BMS", courseField: "Management" },

  // Engineering & Technology
  { courseName: "B.Tech", courseField: "Engineering" },
  { courseName: "B.E.", courseField: "Engineering" },
  { courseName: "Diploma (Polytechnic)", courseField: "Engineering" },
  { courseName: "M.Tech", courseField: "Engineering" },
  { courseName: "M.E.", courseField: "Engineering" },

  // Computer & IT
  { courseName: "BCA", courseField: "Computer & IT" },
  { courseName: "MCA", courseField: "Computer & IT" },
  { courseName: "B.Sc (Computer Science)", courseField: "Computer & IT" },
  { courseName: "M.Sc (Computer Science)", courseField: "Computer & IT" },
  { courseName: "B.Sc (IT)", courseField: "Computer & IT" },
  { courseName: "M.Sc (IT)", courseField: "Computer & IT" },

  // Medical & Healthcare
  { courseName: "MBBS", courseField: "Medical" },
  { courseName: "MD", courseField: "Medical" },
  { courseName: "MS", courseField: "Medical" },
  { courseName: "BDS", courseField: "Medical" },
  { courseName: "MDS", courseField: "Medical" },
  { courseName: "BAMS", courseField: "Medical" },
  { courseName: "BHMS", courseField: "Medical" },
  { courseName: "BUMS", courseField: "Medical" },
  { courseName: "BSMS", courseField: "Medical" },
  { courseName: "BNYS", courseField: "Medical" },
  { courseName: "B.Sc Nursing", courseField: "Medical" },
  { courseName: "GNM", courseField: "Medical" },
  { courseName: "ANM", courseField: "Medical" },
  { courseName: "BPT", courseField: "Medical" },
  { courseName: "MPT", courseField: "Medical" },
  { courseName: "BOT", courseField: "Medical" },
  { courseName: "MOT", courseField: "Medical" },

  // Pharmacy
  { courseName: "B.Pharm", courseField: "Pharmacy" },
  { courseName: "D.Pharm", courseField: "Pharmacy" },
  { courseName: "M.Pharm", courseField: "Pharmacy" },
  { courseName: "Pharm.D", courseField: "Pharmacy" },

  // Paramedical & Allied Health
  { courseName: "DMLT", courseField: "Allied Health" },
  { courseName: "BMLT", courseField: "Allied Health" },
  { courseName: "B.Sc (Radiology)", courseField: "Allied Health" },
  { courseName: "B.Sc (Optometry)", courseField: "Allied Health" },
  { courseName: "B.Sc (Operation Theatre Technology)", courseField: "Allied Health" },

  // Science
  { courseName: "B.Sc", courseField: "Science" },
  { courseName: "B.Sc (Hons)", courseField: "Science" },
  { courseName: "M.Sc", courseField: "Science" },
  { courseName: "Integrated M.Sc", courseField: "Science" },
  { courseName: "B.Sc (Biotechnology)", courseField: "Science" },
  { courseName: "M.Sc (Biotechnology)", courseField: "Science" },

  // Commerce & Finance
  { courseName: "B.Com", courseField: "Commerce" },
  { courseName: "B.Com (Hons)", courseField: "Commerce" },
  { courseName: "M.Com", courseField: "Commerce" },
  { courseName: "BAF", courseField: "Commerce" },
  { courseName: "BFM", courseField: "Commerce" },
  { courseName: "BBI", courseField: "Commerce" },
  { courseName: "CA", courseField: "Professional" },
  { courseName: "CS", courseField: "Professional" },
  { courseName: "CMA", courseField: "Professional" },
  { courseName: "CFA", courseField: "Professional" },
  { courseName: "FRM", courseField: "Professional" },
  { courseName: "CFP", courseField: "Professional" },

  // Arts & Humanities
  { courseName: "B.A", courseField: "Arts & Humanities" },
  { courseName: "M.A", courseField: "Arts & Humanities" },
  { courseName: "BFA", courseField: "Arts & Humanities" },
  { courseName: "MFA", courseField: "Arts & Humanities" },
  { courseName: "BSW", courseField: "Arts & Humanities" },
  { courseName: "MSW", courseField: "Arts & Humanities" },

  // Media & Communication
  { courseName: "BJMC", courseField: "Media & Communication" },
  { courseName: "MJMC", courseField: "Media & Communication" },
  { courseName: "BMM", courseField: "Media & Communication" },

  // Law
  { courseName: "LL.B (3-year)", courseField: "Law" },
  { courseName: "B.A LL.B", courseField: "Law" },
  { courseName: "BBA LL.B", courseField: "Law" },
  { courseName: "B.Com LL.B", courseField: "Law" },
  { courseName: "LL.M", courseField: "Law" },

  // Education
  { courseName: "B.Ed", courseField: "Education" },
  { courseName: "M.Ed", courseField: "Education" },
  { courseName: "D.El.Ed", courseField: "Education" },
  { courseName: "B.P.Ed", courseField: "Education" },
  { courseName: "M.P.Ed", courseField: "Education" },

  // Design & Creative
  { courseName: "B.Des", courseField: "Design" },
  { courseName: "M.Des", courseField: "Design" },
  { courseName: "Fashion Design", courseField: "Design" },
  { courseName: "Interior Design", courseField: "Design" },
  { courseName: "Graphic Design", courseField: "Design" },
  { courseName: "Animation & VFX", courseField: "Design" },

  // Architecture & Planning
  { courseName: "B.Arch", courseField: "Architecture" },
  { courseName: "M.Arch", courseField: "Architecture" },
  { courseName: "B.Plan", courseField: "Architecture" },
  { courseName: "M.Plan", courseField: "Architecture" },

  // Agriculture & Allied
  { courseName: "B.Sc (Agriculture)", courseField: "Agriculture" },
  { courseName: "M.Sc (Agriculture)", courseField: "Agriculture" },
  { courseName: "B.Tech (Agricultural Engineering)", courseField: "Agriculture" },
  { courseName: "B.Sc (Horticulture)", courseField: "Agriculture" },
  { courseName: "B.Sc (Forestry)", courseField: "Agriculture" },
  { courseName: "B.F.Sc (Fisheries)", courseField: "Agriculture" },
  { courseName: "B.V.Sc & AH (Veterinary)", courseField: "Agriculture" },

  // Hotel Management & Tourism
  { courseName: "BHM", courseField: "Hospitality & Tourism" },
  { courseName: "B.Sc (Hospitality & Hotel Administration)", courseField: "Hospitality & Tourism" },
  { courseName: "BTTM", courseField: "Hospitality & Tourism" },

  // Skilled / Vocational
  { courseName: "ITI", courseField: "Vocational" },
  { courseName: "Certificate (Skill Course)", courseField: "Vocational" },
]

