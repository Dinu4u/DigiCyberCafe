"use client";

import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowDown, ArrowUp, Download, PanelsTopLeft, Plus, Save, X } from "lucide-react";

type Step = 0 | 1 | 2;
type Template = "classic" | "botanical" | "modern";
type Language = "English" | "मराठी" | "हिंदी" | "ગુજરાતી" | "తెలుగు" | "বাংলা";
type Field = { id: string; label: string; value: string; include: boolean; placeholder?: string; options?: string[] };
type BiodataDraft = {
  title: string;
  godName: string;
  language: Language;
  fields: Record<Step, Field[]>;
  template: Template;
  accent: string;
  photo: string;
  godPhoto: string;
};

const religions = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other", "Prefer not to say"];
const templates: { id: Template; name: string; description: string; color: string }[] = [
  { id: "classic", name: "Classic", description: "Traditional frame", color: "#b53b0b" },
  { id: "botanical", name: "Botanical", description: "Soft green, natural style", color: "#356b55" },
  { id: "modern", name: "Modern", description: "Minimal navy accent", color: "#34546e" },
];
const stepNames = ["Basic Info", "Family", "Contact"];
const languages: Language[] = ["English", "मराठी", "हिंदी", "ગુજરાતી", "తెలుగు", "বাংলা"];
const blankDraft: BiodataDraft = {
  title: "MARRIAGE BIODATA",
  godName: "",
  language: "English",
  template: "classic",
  accent: templates[0].color,
  photo: "",
  godPhoto: "",
  fields: {
    0: [
      { id: "name", label: "Full Name", value: "", include: true, placeholder: "Enter your full name" },
      { id: "birth", label: "Date of Birth", value: "", include: true, placeholder: "e.g., 06/07/1987" },
      { id: "height", label: "Height", value: "", include: true, placeholder: `e.g., 5'8" or 173 cm` },
      { id: "birthPlace", label: "Place of Birth", value: "", include: true, placeholder: "e.g., Mumbai, Maharashtra" },
      { id: "religion", label: "Religion", value: "", include: true, options: religions },
      { id: "caste", label: "Caste", value: "", include: true, placeholder: "Select or enter your caste" },
      { id: "education", label: "Higher Education", value: "", include: true, placeholder: "e.g., B.Tech in Computer Science" },
      { id: "occupation", label: "Job/Occupation", value: "", include: true, placeholder: "e.g., Software Engineer" },
    ],
    1: [
      { id: "fatherName", label: "Father's Name", value: "", include: true, placeholder: "Enter your father's full name" },
      { id: "fatherOccupation", label: "Father's Occupation", value: "", include: true, placeholder: "e.g., Retired Bank Manager" },
      { id: "motherName", label: "Mother's Name", value: "", include: true, placeholder: "Enter your mother's full name" },
      { id: "motherOccupation", label: "Mother's Occupation", value: "", include: true, placeholder: "e.g., Homemaker or Teacher" },
      { id: "sisters", label: "Sisters", value: "", include: true, placeholder: "e.g., 2, 1 married" },
      { id: "brothers", label: "Brothers", value: "", include: true, placeholder: "e.g., 1 elder, working in USA" },
    ],
    2: [
      { id: "mobile", label: "Mobile Number", value: "", include: true, placeholder: "e.g., +91 98765 43210" },
      { id: "address", label: "Address", value: "", include: true, placeholder: "Full address including city and PIN code" },
    ],
  },
};

const optionalFields: Record<Step, string[]> = {
  0: ["Marital Status", "Rashi", "Nakshatra", "Manglik", "Gotra", "Gan", "Diet", "Disability", "Complexion", "Blood Group", "Salary", "Native Place", "Hobbies & Interests", "Expectations"],
  1: ["Family Type", "Family Status", "Family Values", "Grandfather's Name", "Maternal Uncle", "Family Income"],
  2: ["Alternate Mobile Number", "Email Address", "Current City", "WhatsApp Number", "Contact Person"],
};

const translatedLabels: Record<Language, Record<string, string>> = {
  English: {},
  "हिंदी": {
    "MARRIAGE BIODATA": "विवाह परिचय", "Full Name": "पूरा नाम", "Date of Birth": "जन्म तिथि", "Height": "लंबाई", "Place of Birth": "जन्म स्थान", "Religion": "धर्म", "Caste": "जाति", "Higher Education": "उच्च शिक्षा", "Job/Occupation": "कार्य / व्यवसाय",
    "Father's Name": "पिता का नाम", "Father's Occupation": "पिता का व्यवसाय", "Mother's Name": "माता का नाम", "Mother's Occupation": "माता का व्यवसाय", "Sisters": "बहनें", "Brothers": "भाई",
    "Mobile Number": "मोबाइल नंबर", "Address": "पता", "Marital Status": "वैवाहिक स्थिति", "Rashi": "राशि", "Nakshatra": "नक्षत्र", "Manglik": "मांगलिक", "Gotra": "गोत्र", "Gan": "गण", "Diet": "आहार", "Disability": "दिव्यांगता", "Complexion": "रंग", "Blood Group": "रक्त समूह", "Salary": "वेतन", "Native Place": "मूल निवास", "Hobbies & Interests": "शौक और रुचियां", "Expectations": "अपेक्षाएं",
    "Family Type": "परिवार का प्रकार", "Family Status": "परिवार की स्थिति", "Family Values": "पारिवारिक मूल्य", "Grandfather's Name": "दादाजी का नाम", "Maternal Uncle": "मामा", "Family Income": "पारिवारिक आय", "Alternate Mobile Number": "वैकल्पिक मोबाइल नंबर", "Email Address": "ईमेल पता", "Current City": "वर्तमान शहर", "WhatsApp Number": "व्हाट्सऐप नंबर", "Contact Person": "संपर्क व्यक्ति",
  },
  "मराठी": {
    "MARRIAGE BIODATA": "विवाह परिचय", "Full Name": "पूर्ण नाव", "Date of Birth": "जन्मतारीख", "Height": "उंची", "Place of Birth": "जन्मस्थान", "Religion": "धर्म", "Caste": "जात", "Higher Education": "उच्च शिक्षण", "Job/Occupation": "नोकरी / व्यवसाय",
    "Father's Name": "वडिलांचे नाव", "Father's Occupation": "वडिलांचा व्यवसाय", "Mother's Name": "आईचे नाव", "Mother's Occupation": "आईचा व्यवसाय", "Sisters": "बहिणी", "Brothers": "भाऊ",
    "Mobile Number": "मोबाईल क्रमांक", "Address": "पत्ता", "Marital Status": "वैवाहिक स्थिती", "Rashi": "रास", "Nakshatra": "नक्षत्र", "Manglik": "मांगलिक", "Gotra": "गोत्र", "Gan": "गण", "Diet": "आहार", "Disability": "अपंगत्व", "Complexion": "वर्ण", "Blood Group": "रक्तगट", "Salary": "पगार", "Native Place": "मूळ गाव", "Hobbies & Interests": "छंद आणि आवडी", "Expectations": "अपेक्षा",
    "Family Type": "कुटुंबाचा प्रकार", "Family Status": "कुटुंबाची स्थिती", "Family Values": "कौटुंबिक मूल्ये", "Grandfather's Name": "आजोबांचे नाव", "Maternal Uncle": "मामा", "Family Income": "कुटुंबाचे उत्पन्न", "Alternate Mobile Number": "पर्यायी मोबाईल क्रमांक", "Email Address": "ईमेल पत्ता", "Current City": "सध्याचे शहर", "WhatsApp Number": "व्हॉट्सॲप क्रमांक", "Contact Person": "संपर्क व्यक्ती",
  },
  "ગુજરાતી": {
    "MARRIAGE BIODATA": "લગ્ન બાયોડેટા", "Full Name": "પૂરું નામ", "Date of Birth": "જન્મ તારીખ", "Height": "ઊંચાઈ", "Place of Birth": "જન્મ સ્થળ", "Religion": "ધર્મ", "Caste": "જ્ઞાતિ", "Higher Education": "ઉચ્ચ શિક્ષણ", "Job/Occupation": "નોકરી / વ્યવસાય",
    "Father's Name": "પિતાનું નામ", "Father's Occupation": "પિતાનો વ્યવસાય", "Mother's Name": "માતાનું નામ", "Mother's Occupation": "માતાનો વ્યવસાય", "Sisters": "બહેનો", "Brothers": "ભાઈઓ",
    "Mobile Number": "મોબાઇલ નંબર", "Address": "સરનામું", "Marital Status": "વૈવાહિક સ્થિતિ", "Rashi": "રાશિ", "Nakshatra": "નક્ષત્ર", "Manglik": "માંગલિક", "Gotra": "ગોત્ર", "Gan": "ગણ", "Diet": "આહાર", "Disability": "વિકલાંગતા", "Complexion": "વર્ણ", "Blood Group": "રક્ત જૂથ", "Salary": "પગાર", "Native Place": "મૂળ વતન", "Hobbies & Interests": "શોખ અને રસ", "Expectations": "અપેક્ષાઓ",
    "Family Type": "કુટુંબનો પ્રકાર", "Family Status": "કુટુંબની સ્થિતિ", "Family Values": "કૌટુંબિક મૂલ્યો", "Grandfather's Name": "દાદાનું નામ", "Maternal Uncle": "મામા", "Family Income": "કુટુંબની આવક", "Alternate Mobile Number": "વૈકલ્પિક મોબાઇલ નંબર", "Email Address": "ઈમેલ સરનામું", "Current City": "વર્તમાન શહેર", "WhatsApp Number": "વોટ્સએપ નંબર", "Contact Person": "સંપર્ક વ્યક્તિ",
  },
  "తెలుగు": {
    "MARRIAGE BIODATA": "వివాహ బయోడేటా", "Full Name": "పూర్తి పేరు", "Date of Birth": "పుట్టిన తేదీ", "Height": "ఎత్తు", "Place of Birth": "పుట్టిన ప్రదేశం", "Religion": "మతం", "Caste": "కులం", "Higher Education": "ఉన్నత విద్య", "Job/Occupation": "ఉద్యోగం / వృత్తి",
    "Father's Name": "తండ్రి పేరు", "Father's Occupation": "తండ్రి వృత్తి", "Mother's Name": "తల్లి పేరు", "Mother's Occupation": "తల్లి వృత్తి", "Sisters": "సోదరీమణులు", "Brothers": "సోదరులు",
    "Mobile Number": "మొబైల్ నంబర్", "Address": "చిరునామా", "Marital Status": "వైవాహిక స్థితి", "Rashi": "రాశి", "Nakshatra": "నక్షత్రం", "Manglik": "మాంగళిక్", "Gotra": "గోత్రం", "Gan": "గణం", "Diet": "ఆహారం", "Disability": "వైకల్యం", "Complexion": "ఛాయ", "Blood Group": "రక్త వర్గం", "Salary": "జీతం", "Native Place": "స్వస్థలం", "Hobbies & Interests": "అభిరుచులు", "Expectations": "అంచనాలు",
    "Family Type": "కుటుంబ రకం", "Family Status": "కుటుంబ స్థితి", "Family Values": "కుటుంబ విలువలు", "Grandfather's Name": "తాత పేరు", "Maternal Uncle": "మేనమామ", "Family Income": "కుటుంబ ఆదాయం", "Alternate Mobile Number": "ప్రత్యామ్నాయ మొబైల్ నంబర్", "Email Address": "ఈమెయిల్ చిరునామా", "Current City": "ప్రస్తుత నగరం", "WhatsApp Number": "వాట్సాప్ నంబర్", "Contact Person": "సంప్రదింపు వ్యక్తి",
  },
  "বাংলা": {
    "MARRIAGE BIODATA": "বিবাহের বায়োডাটা", "Full Name": "পুরো নাম", "Date of Birth": "জন্ম তারিখ", "Height": "উচ্চতা", "Place of Birth": "জন্মস্থান", "Religion": "ধর্ম", "Caste": "জাতি", "Higher Education": "উচ্চশিক্ষা", "Job/Occupation": "পেশা",
    "Father's Name": "বাবার নাম", "Father's Occupation": "বাবার পেশা", "Mother's Name": "মায়ের নাম", "Mother's Occupation": "মায়ের পেশা", "Sisters": "বোন", "Brothers": "ভাই",
    "Mobile Number": "মোবাইল নম্বর", "Address": "ঠিকানা", "Marital Status": "বৈবাহিক অবস্থা", "Rashi": "রাশি", "Nakshatra": "নক্ষত্র", "Manglik": "মাঙ্গলিক", "Gotra": "গোত্র", "Gan": "গণ", "Diet": "খাদ্যাভ্যাস", "Disability": "প্রতিবন্ধকতা", "Complexion": "গায়ের রং", "Blood Group": "রক্তের গ্রুপ", "Salary": "বেতন", "Native Place": "নিজের শহর", "Hobbies & Interests": "শখ ও আগ্রহ", "Expectations": "প্রত্যাশা",
    "Family Type": "পরিবারের ধরন", "Family Status": "পরিবারের অবস্থা", "Family Values": "পারিবারিক মূল্যবোধ", "Grandfather's Name": "দাদুর নাম", "Maternal Uncle": "মামা", "Family Income": "পারিবারিক আয়", "Alternate Mobile Number": "বিকল্প মোবাইল নম্বর", "Email Address": "ইমেল ঠিকানা", "Current City": "বর্তমান শহর", "WhatsApp Number": "হোয়াটসঅ্যাপ নম্বর", "Contact Person": "যোগাযোগের ব্যক্তি",
  },
};

function loadDraft(): BiodataDraft {
  try {
    const raw = localStorage.getItem("ecybercafe-biodata-draft");
    if (!raw) return blankDraft;
    const saved = JSON.parse(raw) as Partial<BiodataDraft>;
    const validFields = (section: Step) => {
      const fields = saved.fields?.[section];
      if (!Array.isArray(fields)) return blankDraft.fields[section];
      return fields.filter((field) => field && typeof field.id === "string" && typeof field.label === "string").map((field) => ({
        ...field,
        value: typeof field.value === "string" ? field.value : "",
        include: field.include !== false,
      }));
    };
    return {
      title: typeof saved.title === "string" ? saved.title : blankDraft.title,
      godName: typeof saved.godName === "string" ? saved.godName : "",
      language: languages.includes(saved.language as Language) ? saved.language as Language : blankDraft.language,
      template: templates.some((item) => item.id === saved.template) ? saved.template as Template : blankDraft.template,
      accent: /^#[0-9a-f]{6}$/i.test(saved.accent ?? "") ? saved.accent! : blankDraft.accent,
      photo: typeof saved.photo === "string" ? saved.photo : "",
      godPhoto: typeof saved.godPhoto === "string" ? saved.godPhoto : "",
      fields: {
        0: validFields(0),
        1: validFields(1),
        2: validFields(2),
      },
    };
  } catch {
    return blankDraft;
  }
}

export function DocumentBuilder() {
  const [step, setStep] = useState<Step>(0);
  const [draft, setDraft] = useState<BiodataDraft>(blankDraft);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [newField, setNewField] = useState("");
  const [styleOpen, setStyleOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("ecybercafe-biodata-draft")) return;
    // Restore after hydration so server and initial client render match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(loadDraft());
  }, []);

  function updateField(fieldId: string, patch: Partial<Field>) {
    setDraft((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [step]: current.fields[step].map((field) => field.id === fieldId ? { ...field, ...patch } : field),
      },
    }));
    setSaved(false);
  }

  function addField(label: string) {
    const cleanLabel = label.trim();
    if (!cleanLabel || draft.fields[step].some((field) => field.label.toLowerCase() === cleanLabel.toLowerCase())) return;
    setDraft((current) => ({
      ...current,
      fields: {
        ...current.fields,
        [step]: [...current.fields[step], { id: `custom-${Date.now()}`, label: cleanLabel, value: "", include: true, placeholder: `Enter ${cleanLabel.toLowerCase()}` }],
      },
    }));
    setNewField("");
    setSaved(false);
  }

  function moveField(index: number, direction: -1 | 1) {
    const next = [...draft.fields[step]];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft((current) => ({ ...current, fields: { ...current.fields, [step]: next } }));
    setSaved(false);
  }

  function choosePhoto(file: File | undefined, key: "photo" | "godPhoto") {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 800_000) {
      setMessage("Choose a JPG, PNG, or WebP image smaller than 800 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraft((current) => ({ ...current, [key]: reader.result as string }));
        setMessage("");
        setSaved(false);
      }
    };
    reader.onerror = () => setMessage("Could not read this image. Please choose another file.");
    reader.readAsDataURL(file);
  }

  function saveDraft() {
    try {
      localStorage.setItem("ecybercafe-biodata-draft", JSON.stringify(draft));
      setSaved(true);
      setMessage("");
    } catch {
      setSaved(false);
      setMessage("Could not save the draft. Remove one or both images and try again.");
    }
  }

  function resetDraft() {
    if (!window.confirm("Clear all biodata details and start again?")) return;
    localStorage.removeItem("ecybercafe-biodata-draft");
    setDraft(blankDraft);
    setStep(0);
    setSaved(false);
    setMessage("");
  }

  const currentFields = draft.fields[step];
  const isHindu = draft.fields[0].find((field) => field.id === "religion")?.value === "Hindu";
  const hinduOnly = ["Rashi", "Nakshatra", "Manglik", "Gotra", "Gan"];
  const visibleFields = currentFields.filter((field) => step !== 0 || isHindu || !hinduOnly.includes(field.label));
  const selectedTemplate = templates.find((item) => item.id === draft.template) ?? templates[0];
  const previewFields = ([0, 1, 2] as const).flatMap((section) => draft.fields[section].filter((field) => field.include && field.value.trim() && (section !== 0 || isHindu || !hinduOnly.includes(field.label))));
  const profileFields = previewFields.filter((field) => ["name", "birth", "occupation"].includes(field.id));
  const detailFields = previewFields.filter((field) => !["name", "birth", "occupation"].includes(field.id));

  function nextStep() {
    if (step === 0 && !draft.fields[0].find((field) => field.id === "name")?.value.trim()) {
      setMessage("Please enter your full name before continuing.");
      return;
    }
    setMessage("");
    setStep((step + 1) as Step);
  }

  return (
    <main className="builder-shell biodata-shell">
      <header className="builder-topbar">
        <Link className="back-link" href="/#tools"><ArrowLeft size={17} /> All tools</Link>
        <div className="builder-actions">
          <button className="secondary-button" onClick={saveDraft}><Save size={16} /> {saved ? "Saved locally" : "Save draft"}</button>
          <button className="primary-button" onClick={() => window.print()}><Download size={16} /> Export PDF</button>
        </div>
      </header>
      <div className="biodata-wizard">
        <nav className="biodata-steps" aria-label="Biodata steps">
          {stepNames.map((name, index) => <div className="biodata-step-item" key={name}>
            <button className={step >= index ? "complete" : ""} aria-current={step === index ? "step" : undefined} onClick={() => setStep(index as Step)}><strong>Step {index + 1}</strong><span>{name}</span></button>
            {index < stepNames.length - 1 && <span className="biodata-step-connector" aria-hidden="true" />}
          </div>)}
        </nav>
        <div className="biodata-progress"><span style={{ width: `${((step + 1) / 3) * 100}%` }} /></div>
        {step === 0 && <section className="biodata-settings">
          <label>Biodata title<input value={draft.title} onChange={(event) => { setDraft((current) => ({ ...current, title: event.target.value })); setSaved(false); }} /></label>
          <label>God name<input value={draft.godName} onChange={(event) => { setDraft((current) => ({ ...current, godName: event.target.value })); setSaved(false); }} placeholder="Optional" /></label>
          <PhotoInput label="God photo" image={draft.godPhoto} onChange={(file) => choosePhoto(file, "godPhoto")} onRemove={() => setDraft((current) => ({ ...current, godPhoto: "" }))} />
        </section>}
        <section className="biodata-step-panel">
          <h2>{step === 0 ? "Personal Details" : step === 1 ? "Family Details" : "Contact Details"}</h2>
          {visibleFields.map((field, index) => <div className="biodata-field-row" key={field.id}>
            <label className="biodata-field">
              <span>{field.label}{field.id === "name" || field.id === "mobile" ? " *" : ""}</span>
              {field.options ? <select value={field.value} onChange={(event) => updateField(field.id, { value: event.target.value, label: field.id === "religion" ? "Religion" : field.label })}>
                <option value="">{field.id === "religion" ? "Select your religion" : "Select an option"}</option>
                {field.options.map((option) => <option key={option}>{option}</option>)}
              </select> : ["address", "hobbies", "expectations", "familyValues"].includes(field.id) ? <textarea value={field.value} onChange={(event) => updateField(field.id, { value: event.target.value })} placeholder={field.placeholder} rows={2} /> : <input value={field.value} onChange={(event) => updateField(field.id, { value: event.target.value })} placeholder={field.placeholder} type={field.id === "birth" ? "text" : field.id === "email" ? "email" : "text"} />}
            </label>
            <label className="biodata-include"><input type="checkbox" checked={field.include} onChange={(event) => updateField(field.id, { include: event.target.checked })} /> Include in biodata</label>
            <div className="biodata-field-actions">
              <button type="button" aria-label={`Move ${field.label} up`} disabled={index === 0} onClick={() => moveField(index, -1)}><ArrowUp size={15} /></button>
              <button type="button" aria-label={`Move ${field.label} down`} disabled={index === currentFields.length - 1} onClick={() => moveField(index, 1)}><ArrowDown size={15} /></button>
              {field.id.startsWith("custom-") && <button type="button" aria-label={`Remove ${field.label}`} onClick={() => setDraft((current) => ({ ...current, fields: { ...current.fields, [step]: current.fields[step].filter((item) => item.id !== field.id) } }))}><X size={14} /></button>}
            </div>
          </div>)}
          <form className="biodata-add-field" onSubmit={(event) => { event.preventDefault(); addField(newField); }}>
            <input value={newField} onChange={(event) => setNewField(event.target.value)} placeholder="New field name" aria-label="New field name" />
            <button type="submit"><Plus size={14} /> Add New Field</button>
          </form>
          <div className="biodata-optional"><small>Add more details (optional)</small><div>{optionalFields[step].filter((label) => (step !== 0 || isHindu || !hinduOnly.includes(label)) && !currentFields.some((field) => field.label.toLowerCase() === label.toLowerCase())).map((label) => <button type="button" key={label} onClick={() => addField(label)}>+ {label}</button>)}</div></div>
        </section>
        {step === 2 && <section className="biodata-photo-section">
          <PhotoInput label="Choose your photo" image={draft.photo} onChange={(file) => choosePhoto(file, "photo")} onRemove={() => setDraft((current) => ({ ...current, photo: "" }))} />
          <p>Use a clear, recent portrait. Your photo stays in this browser and can be included in the exported biodata.</p>
        </section>}
        {message && <p className="biodata-message" role="alert">{message}</p>}
        <footer className="biodata-wizard-actions">
          {step > 0 && <button type="button" onClick={() => setStep((step - 1) as Step)}>‹ Previous</button>}
          <button type="button" className="biodata-reset" onClick={resetDraft}>Reset Form</button>
          {step < 2 ? <button type="button" className="next" onClick={nextStep}>Next Step ›</button> : <button type="button" className="next" onClick={() => {
            if (!draft.fields[0].find((field) => field.id === "name")?.value.trim() || !draft.fields[2].find((field) => field.id === "mobile")?.value.trim()) {
              setMessage("Please enter your full name and mobile number before previewing your biodata.");
              return;
            }
            setMessage("");
            window.print();
          }}>Preview Biodata</button>}
        </footer>
        <section className="biodata-live-preview">
          <div className="biodata-preview-heading">
            <strong>Live preview · {selectedTemplate.name}</strong>
            <button type="button" className="biodata-style-trigger" aria-label="Choose template style" title="Choose template style" onClick={() => setStyleOpen(true)}><PanelsTopLeft size={19} /><span>Template style</span></button>
          </div>
          <div className={`biodata-print template-${draft.template}`} style={{ "--biodata-accent": draft.accent } as CSSProperties}>
            {(draft.godPhoto || draft.godName) && <div className="biodata-god">
              {draft.godPhoto && <Image src={draft.godPhoto} alt="" width={48} height={48} unoptimized />}
              {draft.godName && <small>{draft.godName}</small>}
            </div>}
            <p className="biodata-title">{translatedLabels[draft.language][draft.title.toUpperCase()] ?? draft.title}</p>
            {(draft.photo || profileFields.length > 0) && <div className={`biodata-profile${draft.photo ? " has-photo" : ""}`}>
              {draft.photo && <Image className="biodata-photo" src={draft.photo} alt="Biodata profile" width={120} height={150} unoptimized />}
              <div className="biodata-profile-fields">{profileFields.map((field) => <p key={field.id}><strong>{translatedLabels[draft.language][field.label] ?? field.label}:</strong> {field.value}</p>)}</div>
            </div>}
            <div className="biodata-details">{detailFields.map((field) => <p key={field.id}><strong>{translatedLabels[draft.language][field.label] ?? field.label}:</strong> {field.value}</p>)}</div>
          </div>
        </section>
        {styleOpen && <div className="biodata-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setStyleOpen(false); }}>
          <section className="biodata-template-modal" role="dialog" aria-modal="true" aria-labelledby="biodata-template-title" onKeyDown={(event) => { if (event.key === "Escape") setStyleOpen(false); }}>
            <header>
              <h2 id="biodata-template-title"><PanelsTopLeft size={21} /> Choose a template</h2>
              <button type="button" className="biodata-modal-close" aria-label="Close template settings" onClick={() => setStyleOpen(false)}><X size={20} /></button>
            </header>
            <label className="biodata-modal-language">Language
              <select value={draft.language} onChange={(event) => { setDraft((current) => ({ ...current, language: event.target.value as Language })); setSaved(false); }}>
                {languages.map((language) => <option key={language}>{language}</option>)}
              </select>
            </label>
            <div className="biodata-template-options">
              {templates.map((item) => <button type="button" key={item.id} className={draft.template === item.id ? "selected" : ""} onClick={() => { setDraft((current) => ({ ...current, template: item.id, accent: item.color })); setSaved(false); }}><span className={`biodata-template-swatch template-${item.id}`} /><span><strong>{item.name}</strong><small>{item.description}</small></span></button>)}
            </div>
            <label className="biodata-modal-color">Template color<input type="color" value={draft.accent} onChange={(event) => { setDraft((current) => ({ ...current, accent: event.target.value })); setSaved(false); }} /></label>
          </section>
        </div>}
      </div>
    </main>
  );
}

function PhotoInput({ label, image, onChange, onRemove }: { label: string; image: string; onChange: (file?: File) => void; onRemove: () => void }) {
  return <label className="biodata-photo-input">
    <span>{label}<small>JPG, PNG, or WebP · under 800 KB</small></span>
    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onChange(event.target.files?.[0])} />
    {image && <><Image src={image} alt="" width={42} height={52} unoptimized /><button type="button" aria-label={`Remove ${label}`} onClick={(event) => { event.preventDefault(); onRemove(); }}><X size={14} /></button></>}
  </label>;
}
