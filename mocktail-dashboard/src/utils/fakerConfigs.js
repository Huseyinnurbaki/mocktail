export const fakerConfigs = {
  'First Name': {
    method: 'person.firstName',
    icon: '👤',
    category: 'Person',
    options: [],
    defaultOptions: {}
  },

  'Last Name': {
    method: 'person.lastName',
    icon: '👤',
    category: 'Person',
    options: [],
    defaultOptions: {}
  },

  'Full Name': {
    method: 'person.fullName',
    icon: '👤',
    category: 'Person',
    options: [],
    defaultOptions: {}
  },

  'Email': {
    method: 'internet.email',
    icon: '📧',
    category: 'Contact',
    options: [
      {
        name: 'provider',
        type: 'text',
        label: 'Provider',
        placeholder: 'gmail.com',
        default: ''
      }
    ],
    defaultOptions: {}
  },

  'Phone Number': {
    method: 'phone.number',
    icon: '📞',
    category: 'Contact',
    options: [
      {
        name: 'formatType',
        type: 'select',
        label: 'Format Type',
        options: ['Preset', 'Custom'],
        default: 'Preset'
      },
      {
        name: 'presetFormat',
        type: 'select',
        label: 'Preset Format',
        options: ['!##-!##-####', '(!##) !##-####', '+1-!##-!##-####'],
        default: '!##-!##-####',
        showWhen: { formatType: 'Preset' }
      },
      {
        name: 'customFormat',
        type: 'text',
        label: 'Custom Format',
        placeholder: '!##-!##-#### or (###) ###-####',
        default: '!##-!##-####',
        showWhen: { formatType: 'Custom' }
      }
    ],
    defaultOptions: { formatType: 'Preset', presetFormat: '!##-!##-####' }
  },

  'Street Address': {
    method: 'location.streetAddress',
    icon: '🏠',
    category: 'Location',
    options: [],
    defaultOptions: {}
  },

  'City': {
    method: 'location.city',
    icon: '🌆',
    category: 'Location',
    options: [],
    defaultOptions: {}
  },

  'State': {
    method: 'location.state',
    icon: '🗺️',
    category: 'Location',
    options: [],
    defaultOptions: {}
  },

  'Zip Code': {
    method: 'location.zipCode',
    icon: '📮',
    category: 'Location',
    options: [],
    defaultOptions: {}
  },

  'Country': {
    method: 'location.country',
    icon: '🌍',
    category: 'Location',
    options: [],
    defaultOptions: {}
  },

  'Company Name': {
    method: 'company.name',
    icon: '🏢',
    category: 'Company',
    options: [],
    defaultOptions: {}
  },

  'Job Title': {
    method: 'person.jobTitle',
    icon: '💼',
    category: 'Company',
    options: [],
    defaultOptions: {}
  },

  'Product Name': {
    method: 'commerce.productName',
    icon: '📦',
    category: 'Commerce',
    options: [],
    defaultOptions: {}
  },

  'Integer': {
    method: 'number.int',
    icon: '🔢',
    category: 'Number',
    options: [
      {
        name: 'min',
        type: 'number',
        label: 'Min',
        default: 1
      },
      {
        name: 'max',
        type: 'number',
        label: 'Max',
        default: 100
      }
    ],
    defaultOptions: { min: 1, max: 100 }
  },

  'Decimal': {
    method: 'number.float',
    icon: '💵',
    category: 'Number',
    options: [
      {
        name: 'min',
        type: 'number',
        label: 'Min',
        default: 0
      },
      {
        name: 'max',
        type: 'number',
        label: 'Max',
        default: 1000
      },
      {
        name: 'precision',
        type: 'select',
        label: 'Decimals',
        options: [0, 1, 2, 3, 4],
        default: 2
      }
    ],
    defaultOptions: { min: 0, max: 1000, precision: 2 }
  },

  'Boolean': {
    method: 'datatype.boolean',
    icon: '✓',
    category: 'Basic',
    options: [],
    defaultOptions: {}
  },

  'Date': {
    method: 'date.past',
    icon: '📅',
    category: 'Date & Time',
    options: [],
    defaultOptions: { years: 1 }
  },

  'DateTime': {
    method: 'date.recent',
    icon: '📅',
    category: 'Date & Time',
    options: [],
    defaultOptions: { days: 30 }
  },

  'URL': {
    method: 'internet.url',
    icon: '🔗',
    category: 'Internet',
    options: [],
    defaultOptions: {}
  },

  'Username': {
    method: 'internet.username',
    icon: '👤',
    category: 'Internet',
    options: [],
    defaultOptions: {}
  },

  'UUID': {
    method: 'string.uuid',
    icon: '🆔',
    category: 'Internet',
    options: [],
    defaultOptions: {}
  },

  'Short Text': {
    method: 'lorem.words',
    icon: '📄',
    category: 'Text',
    options: [
      {
        name: 'count',
        type: 'number',
        label: 'Word Count',
        default: 5
      }
    ],
    defaultOptions: { count: 5 }
  },

  'Paragraph': {
    method: 'lorem.paragraph',
    icon: '📝',
    category: 'Text',
    options: [],
    defaultOptions: { sentences: 3 }
  },

  'Keep Original': {
    method: null,
    icon: '🔒',
    category: 'Special',
    options: [],
    defaultOptions: {}
  }
};

// Field name to faker type auto-detection
export const fieldNameMap = {
  // Email
  email: 'Email',
  mail: 'Email',
  emailaddress: 'Email',
  email_address: 'Email',

  // Names
  firstname: 'First Name',
  first_name: 'First Name',
  fname: 'First Name',
  lastname: 'Last Name',
  last_name: 'Last Name',
  lname: 'Last Name',
  name: 'Full Name',
  fullname: 'Full Name',
  full_name: 'Full Name',

  // Phone
  phone: 'Phone Number',
  phonenumber: 'Phone Number',
  phone_number: 'Phone Number',
  tel: 'Phone Number',
  telephone: 'Phone Number',
  mobile: 'Phone Number',

  // Address
  address: 'Street Address',
  street: 'Street Address',
  streetaddress: 'Street Address',
  street_address: 'Street Address',
  city: 'City',
  state: 'State',
  province: 'State',
  zip: 'Zip Code',
  zipcode: 'Zip Code',
  zip_code: 'Zip Code',
  postal: 'Zip Code',
  postalcode: 'Zip Code',
  postal_code: 'Zip Code',
  country: 'Country',

  // Company
  company: 'Company Name',
  companyname: 'Company Name',
  company_name: 'Company Name',
  organization: 'Company Name',
  job: 'Job Title',
  jobtitle: 'Job Title',
  job_title: 'Job Title',
  title: 'Job Title',
  position: 'Job Title',

  // Commerce
  product: 'Product Name',
  productname: 'Product Name',
  product_name: 'Product Name',
  price: 'Decimal',
  amount: 'Decimal',
  cost: 'Decimal',
  total: 'Decimal',

  // IDs
  id: 'Integer',
  userid: 'Integer',
  user_id: 'Integer',
  uuid: 'UUID',
  guid: 'UUID',

  // Dates
  createdat: 'Date',
  created_at: 'Date',
  updatedat: 'Date',
  updated_at: 'Date',
  date: 'Date',
  timestamp: 'DateTime',

  // URLs
  url: 'URL',
  website: 'URL',
  link: 'URL',

  // Username
  username: 'Username',
  user_name: 'Username',
  login: 'Username',

  // Text
  description: 'Paragraph',
  bio: 'Paragraph',
  about: 'Paragraph',
  summary: 'Short Text',
  note: 'Short Text',
  notes: 'Short Text',

  // Boolean
  active: 'Boolean',
  enabled: 'Boolean',
  verified: 'Boolean',
  premium: 'Boolean',
  admin: 'Boolean'
};

// Get categories for organizing dropdown
export const getCategories = () => {
  const categories = {};
  Object.entries(fakerConfigs).forEach(([name, config]) => {
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    categories[config.category].push(name);
  });
  return categories;
};
