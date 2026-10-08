/**
 * Deterministic code checks for DocSaathi.
 * Philosophy: "Code handles facts, the model handles language."
 */

function normalizeText(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Checks if source_text is found inside transcription.
 * Performs exact match, fallback to normalized case-insensitive match.
 */
function verifySourceText(sourceText, transcription) {
  if (!sourceText || !transcription) return false;
  if (transcription.includes(sourceText)) return true;
  
  const normSource = normalizeText(sourceText);
  const normTrans = normalizeText(transcription);
  return normTrans.includes(normSource);
}

/**
 * Validates and calculates days left or overdue status for a given date.
 */
function verifyDate(dateObj, transcription, label = 'due date') {
  const result = {
    value: dateObj?.value || null,
    source_text: dateObj?.source_text || '',
    is_verified: false,
    days_left: null,
    is_past: false,
    warning: null
  };

  if (!dateObj || !dateObj.value) {
    result.warning = `No ${label} specified in document.`;
    return result;
  }

  // 1. Check source text grounding
  if (dateObj.source_text) {
    result.is_verified = verifySourceText(dateObj.source_text, transcription);
  }

  // 2. Validate date string
  const dateParsed = new Date(dateObj.value);
  if (isNaN(dateParsed.getTime())) {
    result.warning = `${label} format could not be verified. Please check paper copy.`;
    return result;
  }

  // 3. Compute days difference from today (normalized to midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dateParsed.setHours(0, 0, 0, 0);

  const diffTime = dateParsed.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  result.days_left = diffDays;
  result.is_past = diffDays < 0;

  if (!result.is_verified) {
    result.warning = `${label} text could not be matched verbatim. Please check against your paper copy.`;
  }

  return result;
}

/**
 * Validates the amount due.
 */
function verifyAmountDue(amountObj, transcription) {
  const result = {
    value: null,
    currency: amountObj?.currency || 'INR',
    source_text: amountObj?.source_text || '',
    is_verified: false,
    warning: null
  };

  if (!amountObj || amountObj.value === null || amountObj.value === undefined) {
    result.warning = 'No amount detected.';
    return result;
  }

  const numVal = Number(amountObj.value);
  if (isNaN(numVal) || numVal < 0) {
    result.warning = 'Amount is not a valid number. Please check against your paper copy.';
    return result;
  }

  result.value = numVal;

  if (amountObj.source_text) {
    result.is_verified = verifySourceText(amountObj.source_text, transcription);
    if (!result.is_verified) {
      result.warning = 'Amount text could not be verified verbatim. Please check against your paper copy.';
    }
  }

  return result;
}

/**
 * Validates medical records details (medications, doctors, follow-ups)
 */
function verifyMedicalDetails(medObj, transcription) {
  if (!medObj || typeof medObj !== 'object') return null;

  return {
    doctor_or_hospital: medObj.doctor_or_hospital ? {
      value: medObj.doctor_or_hospital.value || '',
      source_text: medObj.doctor_or_hospital.source_text || '',
      is_verified: verifySourceText(medObj.doctor_or_hospital.source_text, transcription)
    } : null,
    diagnosis_or_test: medObj.diagnosis_or_test ? {
      value: medObj.diagnosis_or_test.value || '',
      source_text: medObj.diagnosis_or_test.source_text || '',
      is_verified: verifySourceText(medObj.diagnosis_or_test.source_text, transcription)
    } : null,
    medications: (medObj.medications || []).map(med => ({
      name: med.name || '',
      dosage: med.dosage || '',
      timing: med.timing || '',
      source_text: med.source_text || '',
      is_verified: verifySourceText(med.source_text, transcription)
    })),
    follow_up_date: medObj.follow_up_date ? verifyDate(medObj.follow_up_date, transcription, 'follow-up date') : null,
    critical_instructions: (medObj.critical_instructions || []).map(inst => ({
      text: inst.text || '',
      source_text: inst.source_text || '',
      is_verified: verifySourceText(inst.source_text, transcription)
    }))
  };
}

/**
 * Verifies all extracted facts against the transcription.
 */
function verifyExtractedFacts(facts) {
  const transcription = facts.transcription || '';

  const verified = {
    doc_type: facts.doc_type || 'other',
    sender: {
      value: facts.sender?.value || 'Unknown',
      source_text: facts.sender?.source_text || '',
      is_verified: verifySourceText(facts.sender?.source_text, transcription)
    },
    amount_due: verifyAmountDue(facts.amount_due, transcription),
    due_date: verifyDate(facts.due_date, transcription, 'due date'),
    reference_ids: (facts.reference_ids || []).map(ref => ({
      label: ref.label || '',
      value: ref.value || '',
      source_text: ref.source_text || '',
      is_verified: verifySourceText(ref.source_text, transcription)
    })),
    required_actions: (facts.required_actions || []).map(act => ({
      action: act.action || '',
      source_text: act.source_text || '',
      is_verified: verifySourceText(act.source_text, transcription)
    })),
    penalties: (facts.penalties || []).map(pen => ({
      text: pen.text || '',
      source_text: pen.source_text || '',
      is_verified: verifySourceText(pen.source_text, transcription)
    })),
    medical_details: verifyMedicalDetails(facts.medical_details, transcription),
    unclear_parts: facts.unclear_parts || [],
    transcription: transcription
  };

  return verified;
}

module.exports = {
  verifySourceText,
  verifyDate,
  verifyAmountDue,
  verifyMedicalDetails,
  verifyExtractedFacts
};
