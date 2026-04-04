import { Alert } from 'react-native';

export class ComplianceEngine {
    // 2026年合规白名单与高风险区配置
    private static readonly ADEQUACY_DECISION_COUNTRIES = ['EU', 'UK', 'JP', 'KR', 'AU'];
    private static readonly RESTRICTED_REGIONS = ['UNSAFE_REGION', 'UNKNOWN'];

    static async detectJurisdiction(systemRegion: string, ipRegion: string): Promise<'GDPR' | 'PIPL' | 'APP'> {
        if (systemRegion !== ipRegion) {
            this.triggerVPNConflictWarning();
        }
        if (ipRegion === 'CN') return 'PIPL';
        if (ipRegion === 'AU') return 'APP';
        return 'GDPR'; 
    }

    private static triggerVPNConflictWarning() {
        Alert.alert(
            "Compliance Conflict Warning",
            "Your IP address does not match your system region. Please manually confirm your jurisdiction."
        );
    }

    // 修复：引入动态风险评估逻辑
    static evaluateCrossBorderRisk(serviceArea: string, targetArea: string): 'GREEN' | 'ORANGE' {
        if (serviceArea === targetArea) return 'GREEN';
        
        // 传往无充分保护决定的地区触发橙色预警
        if (serviceArea === 'EU' && !this.ADEQUACY_DECISION_COUNTRIES.includes(targetArea)) {
            return 'ORANGE';
        }
        
        // 拦截已知的高风险受限区域
        if (this.RESTRICTED_REGIONS.includes(targetArea)) {
            return 'ORANGE';
        }

        return 'GREEN';
    }
}