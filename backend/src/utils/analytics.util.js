// Utilidades para análisis y estadísticas de los nuevos sistemas

// Calcular promedio de calificaciones
export function calculateAverageRating(ratings) {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10; // Redondear a 1 decimal
}

// Calcular distribución de calificaciones
export function calculateRatingDistribution(ratings) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  ratings.forEach(rating => {
    if (rating.rating >= 1 && rating.rating <= 5) {
      distribution[rating.rating]++;
    }
  });

  return distribution;
}

// Calcular tasa de respuesta en conversaciones
export function calculateResponseRate(conversations) {
  if (!conversations || conversations.length === 0) return 0;
  
  const conversationsWithMessages = conversations.filter(conv => 
    conv.messages && conv.messages.length > 1
  );
  
  return Math.round((conversationsWithMessages.length / conversations.length) * 100);
}

// Calcular tiempo promedio de respuesta
export function calculateAverageResponseTime(messages) {
  if (!messages || messages.length < 2) return 0;
  
  const responseTimes = [];
  
  for (let i = 1; i < messages.length; i++) {
    const currentMessage = messages[i];
    const previousMessage = messages[i - 1];
    
    // Solo considerar si son de diferentes usuarios
    if (currentMessage.sender_id !== previousMessage.sender_id) {
      const responseTime = new Date(currentMessage.sent_at) - new Date(previousMessage.sent_at);
      responseTimes.push(responseTime);
    }
  }
  
  if (responseTimes.length === 0) return 0;
  
  const averageMs = responseTimes.reduce((acc, time) => acc + time, 0) / responseTimes.length;
  return Math.round(averageMs / (1000 * 60)); // Convertir a minutos
}

// Calcular estadísticas de matches
export function calculateMatchStats(matches, timeframe = 'month') {
  if (!matches || matches.length === 0) {
    return {
      total: 0,
      recent: 0,
      successRate: 0,
      averageCompatibility: 0,
    };
  }

  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case 'week':
      startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0);
  }

  const recentMatches = matches.filter(match => 
    new Date(match.date_match) >= startDate
  );

  const matchesWithMessages = matches.filter(match => 
    match.messages && match.messages.length > 0
  );

  const compatibilityScores = matches
    .filter(match => match.compatibility_score)
    .map(match => match.compatibility_score);

  const averageCompatibility = compatibilityScores.length > 0 
    ? compatibilityScores.reduce((acc, score) => acc + score, 0) / compatibilityScores.length
    : 0;

  return {
    total: matches.length,
    recent: recentMatches.length,
    successRate: Math.round((matchesWithMessages.length / matches.length) * 100),
    averageCompatibility: Math.round(averageCompatibility),
  };
}

// Analizar patrones de uso por hora del día
export function analyzeUsagePatterns(activities) {
  const hourlyUsage = new Array(24).fill(0);
  
  activities.forEach(activity => {
    const hour = new Date(activity.timestamp).getHours();
    hourlyUsage[hour]++;
  });
  
  const peakHour = hourlyUsage.indexOf(Math.max(...hourlyUsage));
  const totalActivities = activities.length;
  
  return {
    hourlyDistribution: hourlyUsage,
    peakHour,
    totalActivities,
    averagePerHour: Math.round(totalActivities / 24),
  };
}

// Calcular tendencias de crecimiento
export function calculateGrowthTrends(data, dateField = 'created_at') {
  if (!data || data.length === 0) return { growth: 0, trend: 'stable' };
  
  const now = new Date();
  const lastMonth = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const previousMonth = new Date(now - 60 * 24 * 60 * 60 * 1000);
  
  const lastMonthData = data.filter(item => 
    new Date(item[dateField]) >= lastMonth
  );
  
  const previousMonthData = data.filter(item => {
    const date = new Date(item[dateField]);
    return date >= previousMonth && date < lastMonth;
  });
  
  const currentCount = lastMonthData.length;
  const previousCount = previousMonthData.length;
  
  if (previousCount === 0) {
    return { growth: 0, trend: 'new' };
  }
  
  const growth = Math.round(((currentCount - previousCount) / previousCount) * 100);
  
  let trend = 'stable';
  if (growth > 10) trend = 'growing';
  else if (growth < -10) trend = 'declining';
  
  return { growth, trend };
}

// Segmentar usuarios por actividad
export function segmentUsersByActivity(users, activities) {
  const userActivityCounts = {};
  
  activities.forEach(activity => {
    const userId = activity.user_id;
    if (!userActivityCounts[userId]) {
      userActivityCounts[userId] = 0;
    }
    userActivityCounts[userId]++;
  });
  
  const segments = {
    highly_active: [], // > 20 actividades
    active: [],        // 5-20 actividades
    moderate: [],      // 1-5 actividades
    inactive: [],      // 0 actividades
  };
  
  users.forEach(user => {
    const activityCount = userActivityCounts[user.user_id] || 0;
    
    if (activityCount > 20) {
      segments.highly_active.push(user);
    } else if (activityCount >= 5) {
      segments.active.push(user);
    } else if (activityCount >= 1) {
      segments.moderate.push(user);
    } else {
      segments.inactive.push(user);
    }
  });
  
  return segments;
}

// Calcular métricas de retención
export function calculateRetentionMetrics(users, activities) {
  const now = new Date();
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  
  const activeLastWeek = new Set();
  const activeLastMonth = new Set();
  
  activities.forEach(activity => {
    const activityDate = new Date(activity.timestamp);
    const userId = activity.user_id;
    
    if (activityDate >= oneWeekAgo) {
      activeLastWeek.add(userId);
    }
    if (activityDate >= oneMonthAgo) {
      activeLastMonth.add(userId);
    }
  });
  
  const totalUsers = users.length;
  const weeklyRetention = Math.round((activeLastWeek.size / totalUsers) * 100);
  const monthlyRetention = Math.round((activeLastMonth.size / totalUsers) * 100);
  
  return {
    totalUsers,
    activeLastWeek: activeLastWeek.size,
    activeLastMonth: activeLastMonth.size,
    weeklyRetention,
    monthlyRetention,
  };
}

// Generar insights automáticos
export function generateInsights(data) {
  const insights = [];
  
  // Insight sobre popularidad de categorías
  if (data.categories && data.categories.length > 0) {
    const topCategory = data.categories.reduce((max, cat) => 
      cat.count > max.count ? cat : max
    );
    insights.push({
      type: 'category_popularity',
      message: `La categoría "${topCategory.name}" es la más popular con ${topCategory.count} libros`,
      importance: 'medium',
    });
  }
  
  // Insight sobre calificaciones
  if (data.ratings && data.ratings.length > 0) {
    const avgRating = calculateAverageRating(data.ratings);
    if (avgRating >= 4.5) {
      insights.push({
        type: 'high_satisfaction',
        message: `Excelente satisfacción del usuario con promedio de ${avgRating} estrellas`,
        importance: 'high',
      });
    }
  }
  
  // Insight sobre matches
  if (data.matches && data.matches.length > 0) {
    const matchStats = calculateMatchStats(data.matches);
    if (matchStats.successRate >= 70) {
      insights.push({
        type: 'high_conversion',
        message: `Alta tasa de conversión en matches: ${matchStats.successRate}%`,
        importance: 'high',
      });
    }
  }
  
  // Insight sobre crecimiento
  if (data.growth && data.growth.trend === 'growing') {
    insights.push({
      type: 'growth_trend',
      message: `Crecimiento positivo del ${data.growth.growth}% en el último mes`,
      importance: 'high',
    });
  }
  
  return insights;
}

// Formatear datos para gráficos
export function formatForChart(data, type = 'line') {
  switch (type) {
    case 'line':
      return {
        labels: data.map(item => item.date || item.label),
        datasets: [{
          data: data.map(item => item.value || item.count),
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        }],
      };
    
    case 'bar':
      return {
        labels: data.map(item => item.label || item.name),
        datasets: [{
          data: data.map(item => item.value || item.count),
          backgroundColor: data.map((_, index) => 
            `hsla(${(index * 360) / data.length}, 70%, 60%, 0.8)`
          ),
        }],
      };
    
    case 'pie':
      return {
        labels: data.map(item => item.label || item.name),
        datasets: [{
          data: data.map(item => item.value || item.count),
          backgroundColor: data.map((_, index) => 
            `hsla(${(index * 360) / data.length}, 70%, 60%, 0.8)`
          ),
        }],
      };
    
    default:
      return data;
  }
}

// Comparar períodos
export function comparePeriods(currentPeriod, previousPeriod, metric = 'count') {
  const currentValue = currentPeriod[metric] || 0;
  const previousValue = previousPeriod[metric] || 0;
  
  if (previousValue === 0) {
    return {
      current: currentValue,
      previous: previousValue,
      change: currentValue > 0 ? 100 : 0,
      trend: currentValue > 0 ? 'up' : 'stable',
    };
  }
  
  const change = Math.round(((currentValue - previousValue) / previousValue) * 100);
  const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
  
  return {
    current: currentValue,
    previous: previousValue,
    change: Math.abs(change),
    trend,
  };
} 