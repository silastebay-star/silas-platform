// Census Data Integration Utility
// Provides demographic insights and comparisons for Stoneclough community

// Sample census data structure based on the CSV files
export const censusData = {
  bolton: {
    totalPopulation: 295178,
    ageGroups: {
      '0-15': 19.2,
      '16-24': 9.8,
      '25-34': 14.1,
      '35-49': 20.3,
      '50-64': 18.9,
      '65+': 17.7
    },
    employment: {
      employed: 72.4,
      unemployed: 4.2,
      inactive: 23.4
    },
    education: {
      noQualifications: 22.1,
      level1: 13.2,
      level2: 15.8,
      apprenticeship: 4.1,
      level3: 12.4,
      level4Plus: 32.4
    },
    housing: {
      owned: 68.2,
      socialRented: 16.8,
      privateRented: 13.4,
      other: 1.6
    },
    ethnicity: {
      white: 77.9,
      asian: 17.1,
      black: 1.8,
      mixed: 2.4,
      other: 0.8
    }
  },
  greaterManchester: {
    totalPopulation: 2867800,
    ageGroups: {
      '0-15': 18.9,
      '16-24': 10.2,
      '25-34': 15.8,
      '35-49': 19.8,
      '50-64': 18.1,
      '65+': 17.2
    },
    employment: {
      employed: 74.1,
      unemployed: 3.8,
      inactive: 22.1
    },
    education: {
      noQualifications: 19.8,
      level1: 12.1,
      level2: 14.9,
      apprenticeship: 4.3,
      level3: 13.2,
      level4Plus: 35.7
    },
    housing: {
      owned: 63.4,
      socialRented: 18.2,
      privateRented: 16.8,
      other: 1.6
    },
    ethnicity: {
      white: 80.2,
      asian: 14.1,
      black: 2.9,
      mixed: 2.3,
      other: 0.5
    }
  },
  england: {
    totalPopulation: 56489800,
    ageGroups: {
      '0-15': 18.9,
      '16-24': 9.4,
      '25-34': 14.2,
      '35-49': 20.6,
      '50-64': 18.4,
      '65+': 18.5
    },
    employment: {
      employed: 75.2,
      unemployed: 3.7,
      inactive: 21.1
    },
    education: {
      noQualifications: 18.2,
      level1: 11.8,
      level2: 15.2,
      apprenticeship: 4.1,
      level3: 12.4,
      level4Plus: 38.3
    },
    housing: {
      owned: 62.9,
      socialRented: 17.1,
      privateRented: 18.1,
      other: 1.9
    },
    ethnicity: {
      white: 81.0,
      asian: 9.6,
      black: 4.2,
      mixed: 2.9,
      other: 2.3
    }
  },
  // Estimated Stoneclough data (small community subset)
  stoneclough: {
    totalPopulation: 1250,
    ageGroups: {
      '0-15': 22.1,
      '16-24': 8.3,
      '25-34': 16.2,
      '35-49': 24.8,
      '50-64': 16.9,
      '65+': 11.7
    },
    employment: {
      employed: 78.5,
      unemployed: 2.8,
      inactive: 18.7
    },
    education: {
      noQualifications: 15.2,
      level1: 11.8,
      level2: 16.4,
      apprenticeship: 5.2,
      level3: 14.1,
      level4Plus: 37.3
    },
    housing: {
      owned: 82.4,
      socialRented: 8.2,
      privateRented: 8.1,
      other: 1.3
    },
    ethnicity: {
      white: 89.2,
      asian: 6.8,
      black: 1.2,
      mixed: 2.4,
      other: 0.4
    }
  }
};

// Utility functions for demographic analysis
export const getDemographicComparison = (metric, category) => {
  const areas = ['stoneclough', 'bolton', 'greaterManchester', 'england'];
  return areas.map(area => ({
    area: area.charAt(0).toUpperCase() + area.slice(1).replace(/([A-Z])/g, ' $1'),
    value: censusData[area][metric][category],
    population: censusData[area].totalPopulation
  }));
};

export const getCommunityInsights = () => {
  const insights = [];
  
  // Age distribution insight
  const youngProfessionals = censusData.stoneclough.ageGroups['25-34'];
  const boltonYoungProfessionals = censusData.bolton.ageGroups['25-34'];
  if (youngProfessionals > boltonYoungProfessionals) {
    insights.push({
      category: 'Demographics',
      insight: `Stoneclough has ${(youngProfessionals - boltonYoungProfessionals).toFixed(1)}% more young professionals (25-34) than Bolton average`,
      impact: 'Positive',
      recommendation: 'Focus on career development and networking events for this demographic'
    });
  }
  
  // Education insight
  const highEducation = censusData.stoneclough.education.level4Plus;
  const englandHighEducation = censusData.england.education.level4Plus;
  if (highEducation > englandHighEducation) {
    insights.push({
      category: 'Education',
      insight: `${(highEducation - englandHighEducation).toFixed(1)}% more residents have higher education qualifications than England average`,
      impact: 'Positive',
      recommendation: 'Leverage high education levels for knowledge sharing and mentorship programs'
    });
  }
  
  // Housing insight
  const homeOwnership = censusData.stoneclough.housing.owned;
  const englandHomeOwnership = censusData.england.housing.owned;
  if (homeOwnership > englandHomeOwnership) {
    insights.push({
      category: 'Housing',
      insight: `Home ownership rate is ${(homeOwnership - englandHomeOwnership).toFixed(1)}% higher than England average`,
      impact: 'Positive',
      recommendation: 'High home ownership suggests strong community investment - focus on long-term projects'
    });
  }
  
  return insights;
};

export const getTargetDemographics = () => {
  const stoneclough = censusData.stoneclough;
  const bolton = censusData.bolton;
  
  // Identify underrepresented groups for targeted outreach
  const targets = [];
  
  // Check age groups
  Object.entries(stoneclough.ageGroups).forEach(([ageGroup, percentage]) => {
    const boltonPercentage = bolton.ageGroups[ageGroup];
    if (percentage < boltonPercentage - 2) {
      targets.push({
        demographic: `Age ${ageGroup}`,
        currentPercentage: percentage,
        targetPercentage: boltonPercentage,
        priority: 'High',
        strategy: `Targeted outreach and programming for ${ageGroup} age group`
      });
    }
  });
  
  return targets;
};

export const formatPercentage = (value) => `${value.toFixed(1)}%`;
export const formatPopulation = (value) => value.toLocaleString();
