const analyzeSchema = {
  type: 'object',
  properties: {
    transcription: { type: 'string' },
    doc_type: {
      type: 'string',
      enum: [
        'electricity_bill',
        'bank_notice',
        'insurance_letter',
        'rental_agreement',
        'scheme_form',
        'government_scheme',
        'cghs_document',
        'medical_report',
        'medical_prescription',
        'tax_notice',
        'legal_notice',
        'other_bill',
        'other_letter',
        'other'
      ]
    },
    sender: { type: 'string' },
    document_language: { type: 'string' },
    summary_en: { type: 'string' },
    amount_due: {
      type: 'object',
      properties: {
        value: { type: ['number', 'null'] },
        source_text: { type: 'string' }
      },
      required: ['value', 'source_text']
    },
    due_date: {
      type: 'object',
      properties: {
        value: { type: ['string', 'null'] },
        source_text: { type: 'string' }
      },
      required: ['value', 'source_text']
    },
    ids: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' }
        },
        required: ['label', 'value']
      }
    },
    required_actions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          source_text: { type: 'string' }
        },
        required: ['action', 'source_text']
      }
    },
    penalties: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          source_text: { type: 'string' }
        },
        required: ['description', 'source_text']
      }
    },
    unclear_parts: {
      type: 'array',
      items: { type: 'string' }
    },
    confidence: { type: 'number' }
  },
  required: [
    'transcription',
    'doc_type',
    'sender',
    'document_language',
    'summary_en',
    'amount_due',
    'due_date',
    'ids',
    'required_actions',
    'penalties',
    'unclear_parts',
    'confidence'
  ]
};

const scamSchema = {
  type: 'object',
  properties: {
    verdict: {
      type: 'string',
      enum: ['likely_genuine', 'suspicious', 'likely_scam']
    },
    reasons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          reason: { type: 'string' },
          source_text: { type: 'string' }
        },
        required: ['reason', 'source_text']
      }
    }
  },
  required: ['verdict', 'reasons']
};

module.exports = { analyzeSchema, scamSchema };
