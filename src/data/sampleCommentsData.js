// Sample comments data for SILAS pins
export const SAMPLE_COMMENTS = {
  pin_1: [ // St. Mary's Parish Church
    {
      id: 'comment_1',
      content: 'Beautiful service last Sunday! Father Michael\'s sermon was truly inspiring.',
      author: 'Margaret Wilson',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      reactions: { like: 8, love: 3 }
    },
    {
      id: 'comment_2',
      content: 'The community outreach program has been such a blessing. Thank you for all the hard work!',
      author: 'David Thompson',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      reactions: { like: 12, love: 7 }
    },
    {
      id: 'comment_3',
      content: 'Looking forward to the Christmas concert next month. The choir has been practicing beautifully!',
      author: 'Emily Roberts',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      reactions: { like: 15, love: 9 }
    }
  ],

  pin_2: [ // Community Bible Study
    {
      id: 'comment_4',
      content: 'Great discussion on Matthew 5 last week. Really opened my eyes to new perspectives.',
      author: 'John Miller',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 6, love: 4 }
    },
    {
      id: 'comment_5',
      content: 'New members always welcome! We have such a supportive group.',
      author: 'Sarah Thompson',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 9, love: 5 }
    }
  ],

  pin_4: [ // Stoneclough Farmers Market
    {
      id: 'comment_6',
      content: 'The fresh vegetables from Green Valley Farm are amazing! Best tomatoes I\'ve ever tasted.',
      author: 'Lisa Chen',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 14, love: 8 }
    },
    {
      id: 'comment_7',
      content: 'Love supporting our local farmers. The honey from Stoneclough Apiaries is incredible!',
      author: 'Michael Brown',
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 11, love: 6 }
    },
    {
      id: 'comment_8',
      content: 'Great atmosphere every Saturday. The kids love the face painting booth!',
      author: 'Jennifer Davis',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 18, love: 12 }
    }
  ],

  pin_7: [ // Community Solar Project
    {
      id: 'comment_9',
      content: 'Excited to volunteer for Phase 2! When do we start the installation?',
      author: 'Alex Green',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 7, support: 5 }
    },
    {
      id: 'comment_10',
      content: 'This project is going to save the community so much on electricity costs. Great initiative!',
      author: 'Rachel Martinez',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 13, love: 8 }
    },
    {
      id: 'comment_11',
      content: 'Phase 1 looks fantastic! The panels are working perfectly and generating clean energy.',
      author: 'Green Energy Team',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 22, love: 15, support: 9 }
    }
  ],

  pin_10: [ // Stoneclough Community Center
    {
      id: 'comment_12',
      content: 'The new meeting rooms are perfect for our book club. Thank you for the upgrades!',
      author: 'Patricia Johnson',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 9, love: 4 }
    },
    {
      id: 'comment_13',
      content: 'My kids love the after-school programs here. Such a valuable community resource!',
      author: 'Carlos Rodriguez',
      created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 16, love: 11 }
    }
  ],

  pin_11: [ // Annual Summer Festival
    {
      id: 'comment_14',
      content: 'Can\'t wait for July 15th! Last year\'s festival was absolutely amazing.',
      author: 'Sophie Anderson',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      reactions: { like: 25, love: 18, excited: 12 }
    },
    {
      id: 'comment_15',
      content: 'The local band lineup looks incredible this year. Community talent at its finest!',
      author: 'Mark Williams',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 19, love: 14 }
    },
    {
      id: 'comment_16',
      content: 'Volunteers needed for setup and cleanup! Sign up at the community center.',
      author: 'Festival Committee',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 31, support: 23 }
    }
  ],

  pin_12: [ // Stoneclough Public Library
    {
      id: 'comment_17',
      content: 'The new digital literacy program has been so helpful for seniors in our community.',
      author: 'Head Librarian',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 14, love: 9 }
    },
    {
      id: 'comment_18',
      content: 'Love the quiet study spaces upstairs. Perfect for working from home days!',
      author: 'Jessica Taylor',
      created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 12, love: 7 }
    }
  ],

  pin_14: [ // Community Health Clinic
    {
      id: 'comment_19',
      content: 'Dr. Wilson and the staff provide such compassionate care. Grateful for this clinic!',
      author: 'Robert Clark',
      created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 28, love: 19, grateful: 15 }
    },
    {
      id: 'comment_20',
      content: 'The wellness workshops have been life-changing. Thank you for focusing on prevention!',
      author: 'Maria Gonzalez',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 21, love: 16 }
    }
  ],

  pin_15: [ // Morning Yoga in the Park
    {
      id: 'comment_21',
      content: 'Lisa is an amazing instructor! These morning sessions start my day perfectly.',
      author: 'Amanda White',
      created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 15, love: 10, namaste: 8 }
    },
    {
      id: 'comment_22',
      content: 'Love doing yoga outdoors! The fresh air makes such a difference.',
      author: 'Kevin Lee',
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      reactions: { like: 12, love: 8 }
    }
  ]
};

// Function to get comments for a specific pin
export const getCommentsForPin = (pinId) => {
  return SAMPLE_COMMENTS[pinId] || [];
};

// Function to get all comments
export const getAllComments = () => {
  return Object.values(SAMPLE_COMMENTS).flat();
};

export default SAMPLE_COMMENTS;
