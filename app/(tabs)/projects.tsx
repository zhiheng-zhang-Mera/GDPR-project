import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProjectsScreen() {
  // 模拟已加入项目的统计数据
  const stats = {
    total: 120,
    breakdown: [
      { id: '1', label: 'Steps', count: 20, icon: 'walk' },
      { id: '2', label: 'Heart Rate', count: 15, icon: 'heart' },
      { id: '3', label: 'Body Temp', count: 10, icon: 'thermometer' },
    ]
  };

  // 模拟项目数据
  const [enrolledProjects, setEnrolledProjects] = useState([
    { id: 'p1', name: 'Global Heart Study', enrolled: true },
    { id: 'p2', name: 'Sleep Patterns 2026', enrolled: true },
  ]);

  const availableProjects = [
    { 
      id: 'p3', 
      name: 'Diabetes Prevention AI', 
      desc: '本研究旨在通过机器学习分析生活习惯与血糖波动的关系。',
      requiredData: ['Blood Sugar', 'Steps', 'Weight']
    },
    { 
      id: 'p4', 
      name: 'Urban Stress Mapping', 
      desc: '分析城市环境对心率变异性的影响。',
      requiredData: ['Heart Rate', 'Location (Coarse)']
    },
  ];

  const [selectedProject, setSelectedProject] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const toggleEnrollment = (id) => {
    setEnrolledProjects(prev => prev.map(p => 
      p.id === id ? { ...p, enrolled: !p.enrolled } : p
    ));
  };

  const handleShowDetail = (project) => {
    setSelectedProject(project);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        
        <Text style={styles.mainTitle}>Research Projects</Text>

        {/* 顶部统计区域 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsHeader}>Total Joined Projects: {stats.total}</Text>
          <View style={styles.divider} />
          <Text style={styles.subHeader}>Data Usage Breakdown:</Text>
          {stats.breakdown.map(item => (
            <View key={item.id} style={styles.statsRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name={item.icon} size={18} color="#666" style={{ marginRight: 8 }} />
                <Text>{item.label}</Text>
              </View>
              <Text style={styles.statsCount}>{item.count} projects</Text>
            </View>
          ))}
        </View>

        {/* 已加入项目列表 */}
        <Text style={styles.sectionTitle}>Currently Enrolled</Text>
        <View style={styles.tableCard}>
          {enrolledProjects.map(project => (
            <View key={project.id} style={styles.tableRow}>
              <Text style={styles.projectName}>{project.name}</Text>
              <Switch 
                value={project.enrolled} 
                onValueChange={() => toggleEnrollment(project.id)}
                trackColor={{ false: "#D1D1D6", true: "#34C759" }}
              />
            </View>
          ))}
        </View>

        {/* 可加入项目列表 */}
        <Text style={styles.sectionTitle}>Available Opportunities</Text>
        <View style={styles.tableCard}>
          {availableProjects.map(project => (
            <View key={project.id} style={styles.tableRow}>
              <Text style={styles.projectName}>{project.name}</Text>
              <TouchableOpacity 
                style={styles.detailBtn} 
                onPress={() => handleShowDetail(project)}
              >
                <Text style={styles.detailBtnText}>Details</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 项目详情弹窗 (Modal) */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedProject && (
              <>
                <Text style={styles.modalTitle}>{selectedProject.name}</Text>
                <Text style={styles.modalDesc}>{selectedProject.desc}</Text>
                
                <View style={styles.dataRequestBox}>
                  <Text style={styles.dataRequestTitle}>Data Access Required:</Text>
                  {selectedProject.requiredData.map((data, index) => (
                    <Text key={index} style={styles.dataItem}>• {data}</Text>
                  ))}
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.btnCancel]} 
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={{ color: '#666' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalBtn, styles.btnJoin]} 
                    onPress={() => {
                      alert("Joined " + selectedProject.name);
                      setModalVisible(false);
                    }}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Join Project</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  mainTitle: { fontSize: 34, fontWeight: 'bold', marginBottom: 20 },
  statsCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 25, elevation: 2 },
  statsHeader: { fontSize: 18, fontWeight: 'bold', color: '#007AFF' },
  divider: { height: 1, backgroundColor: '#EEE', marginVertical: 12 },
  subHeader: { fontSize: 14, color: '#8E8E93', marginBottom: 10 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  statsCount: { fontWeight: '600', color: '#333' },
  
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, marginLeft: 5 },
  tableCard: { backgroundColor: '#FFF', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  tableRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F0F0F0' 
  },
  projectName: { fontSize: 16, color: '#333' },
  detailBtn: { backgroundColor: '#E5E5EA', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 15 },
  detailBtnText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },

  // Modal 样式
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { 
    backgroundColor: '#FFF', 
    borderTopLeftRadius: 25, 
    borderTopRightRadius: 25, 
    padding: 25, 
    minHeight: '40%' 
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  modalDesc: { fontSize: 16, color: '#444', lineHeight: 22, marginBottom: 20 },
  dataRequestBox: { backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, marginBottom: 25 },
  dataRequestTitle: { fontWeight: 'bold', marginBottom: 8, color: '#FF3B30' },
  dataItem: { color: '#666', marginBottom: 4 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalBtn: { flex: 0.48, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  btnCancel: { backgroundColor: '#E5E5EA' },
  btnJoin: { backgroundColor: '#34C759' }
});