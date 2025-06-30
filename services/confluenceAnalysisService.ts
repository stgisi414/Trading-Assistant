
export interface ConfluenceAnalysis {
    overallScore: number;
    equilibriumStatus: 'Optimal' | 'Good' | 'Imbalanced' | 'Critical';
    categoryScores: {
        trend: number;
        momentum: number;
        volatility: number;
        volume: number;
    };
    recommendations: string[];
    balanceMetrics: {
        coverage: number;
        diversity: number;
        redundancy: number;
        synergy: number;
    };
}

export interface IndicatorWeights {
    [key: string]: {
        category: 'trend' | 'momentum' | 'volatility' | 'volume';
        weight: number;
        synergies: string[];
        conflicts: string[];
    };
}

export const INDICATOR_METADATA: IndicatorWeights = {
    'SMA': {
        category: 'trend',
        weight: 0.8,
        synergies: ['EMA', 'MACD', 'Volume'],
        conflicts: []
    },
    'EMA': {
        category: 'trend',
        weight: 0.9,
        synergies: ['MACD', 'RSI', 'Volume'],
        conflicts: []
    },
    'RSI': {
        category: 'momentum',
        weight: 0.85,
        synergies: ['StochasticOscillator', 'BollingerBands', 'Volume'],
        conflicts: []
    },
    'MACD': {
        category: 'trend',
        weight: 0.9,
        synergies: ['EMA', 'RSI', 'Volume'],
        conflicts: []
    },
    'BollingerBands': {
        category: 'volatility',
        weight: 0.8,
        synergies: ['RSI', 'Volume', 'Volatility'],
        conflicts: []
    },
    'StochasticOscillator': {
        category: 'momentum',
        weight: 0.75,
        synergies: ['RSI', 'BollingerBands'],
        conflicts: []
    },
    'ADX': {
        category: 'trend',
        weight: 0.7,
        synergies: ['SMA', 'EMA', 'MACD'],
        conflicts: []
    },
    'Volume': {
        category: 'volume',
        weight: 1.0,
        synergies: ['SMA', 'EMA', 'MACD', 'RSI', 'BollingerBands'],
        conflicts: []
    },
    'Volatility': {
        category: 'volatility',
        weight: 0.8,
        synergies: ['BollingerBands', 'RSI'],
        conflicts: []
    }
};

export const analyzeIndicatorConfluence = (selectedIndicators: string[]): ConfluenceAnalysis => {
    // Categorize indicators
    const categories = {
        trend: selectedIndicators.filter(ind => INDICATOR_METADATA[ind]?.category === 'trend'),
        momentum: selectedIndicators.filter(ind => INDICATOR_METADATA[ind]?.category === 'momentum'),
        volatility: selectedIndicators.filter(ind => INDICATOR_METADATA[ind]?.category === 'volatility'),
        volume: selectedIndicators.filter(ind => INDICATOR_METADATA[ind]?.category === 'volume')
    };

    // Calculate category scores
    const categoryScores = {
        trend: Math.min(categories.trend.length / 2, 1) * 100, // Optimal: 2 trend indicators
        momentum: Math.min(categories.momentum.length / 2, 1) * 100, // Optimal: 2 momentum indicators
        volatility: Math.min(categories.volatility.length / 1, 1) * 100, // Optimal: 1 volatility indicator
        volume: Math.min(categories.volume.length / 1, 1) * 100 // Optimal: 1 volume indicator
    };

    // Calculate balance metrics
    const coverage = Object.values(categories).filter(cat => cat.length > 0).length / 4;
    const diversity = selectedIndicators.length / Object.keys(INDICATOR_METADATA).length;
    
    // Calculate redundancy (penalty for too many indicators in same category)
    const redundancy = Object.values(categories).reduce((penalty, cat) => {
        return penalty + Math.max(0, cat.length - 2) * 0.1;
    }, 0);

    // Calculate synergy score
    const synergy = selectedIndicators.reduce((score, indicator) => {
        const metadata = INDICATOR_METADATA[indicator];
        if (!metadata) return score;
        
        const synergyCount = metadata.synergies.filter(syn => 
            selectedIndicators.includes(syn)
        ).length;
        
        return score + (synergyCount * 0.1);
    }, 0) / selectedIndicators.length;

    const balanceMetrics = {
        coverage,
        diversity,
        redundancy: Math.max(0, 1 - redundancy),
        synergy: Math.min(synergy, 1)
    };

    // Calculate overall confluence score
    const overallScore = (
        (categoryScores.trend + categoryScores.momentum + categoryScores.volatility + categoryScores.volume) / 4 *
        coverage * 
        balanceMetrics.synergy *
        balanceMetrics.redundancy
    );

    // Determine equilibrium status
    let equilibriumStatus: 'Optimal' | 'Good' | 'Imbalanced' | 'Critical';
    if (overallScore >= 80 && coverage >= 0.75) {
        equilibriumStatus = 'Optimal';
    } else if (overallScore >= 60 && coverage >= 0.5) {
        equilibriumStatus = 'Good';
    } else if (overallScore >= 40) {
        equilibriumStatus = 'Imbalanced';
    } else {
        equilibriumStatus = 'Critical';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (categories.trend.length === 0) {
        recommendations.push('Add trend indicators like SMA or EMA for directional bias');
    }
    if (categories.momentum.length === 0) {
        recommendations.push('Include momentum indicators like RSI for timing entries');
    }
    if (categories.volatility.length === 0) {
        recommendations.push('Add volatility indicators like Bollinger Bands for risk assessment');
    }
    if (categories.volume.length === 0) {
        recommendations.push('Include Volume analysis to confirm price movements');
    }
    
    if (categories.trend.length > 2) {
        recommendations.push('Consider reducing trend indicators to avoid redundancy');
    }
    if (categories.momentum.length > 2) {
        recommendations.push('Consider reducing momentum indicators to avoid conflicting signals');
    }

    if (coverage < 0.5) {
        recommendations.push('Diversify across multiple indicator categories for better confluence');
    }

    if (balanceMetrics.synergy < 0.3) {
        recommendations.push('Select indicators that complement each other for better signal confirmation');
    }

    return {
        overallScore,
        equilibriumStatus,
        categoryScores,
        recommendations,
        balanceMetrics
    };
};

export const getOptimalIndicatorCombinations = (strategy: 'day-trading' | 'swing-trading' | 'position-trading'): string[][] => {
    const combinations = {
        'day-trading': [
            ['EMA', 'RSI', 'Volume', 'BollingerBands'],
            ['SMA', 'MACD', 'StochasticOscillator', 'Volume'],
            ['EMA', 'RSI', 'ADX', 'Volume']
        ],
        'swing-trading': [
            ['SMA', 'MACD', 'RSI', 'Volume'],
            ['EMA', 'BollingerBands', 'RSI', 'ADX'],
            ['SMA', 'RSI', 'StochasticOscillator', 'Volume']
        ],
        'position-trading': [
            ['SMA', 'MACD', 'Volume', 'Volatility'],
            ['EMA', 'RSI', 'ADX', 'Volume'],
            ['SMA', 'BollingerBands', 'MACD', 'Volume']
        ]
    };

    return combinations[strategy] || combinations['swing-trading'];
};

export const validateIndicatorEquilibrium = (
    selectedIndicators: string[],
    strategy?: string
): { isBalanced: boolean; issues: string[]; suggestions: string[] } => {
    const analysis = analyzeIndicatorConfluence(selectedIndicators);
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (analysis.equilibriumStatus === 'Critical') {
        issues.push('Critical imbalance in indicator selection');
        suggestions.push('Start with a balanced foundation: one trend, one momentum, and volume');
    }

    if (analysis.balanceMetrics.coverage < 0.5) {
        issues.push('Insufficient category coverage');
        suggestions.push('Add indicators from missing categories for comprehensive analysis');
    }

    if (analysis.balanceMetrics.redundancy < 0.7) {
        issues.push('Too many indicators in same category');
        suggestions.push('Remove redundant indicators to reduce noise');
    }

    if (analysis.balanceMetrics.synergy < 0.4) {
        issues.push('Poor indicator synergy');
        suggestions.push('Choose indicators that complement each other');
    }

    return {
        isBalanced: analysis.equilibriumStatus === 'Optimal' || analysis.equilibriumStatus === 'Good',
        issues,
        suggestions
    };
};
