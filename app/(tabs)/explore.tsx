import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { Text, Card } from 'react-native-paper';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';


const screenWidth = Dimensions.get('window').width;
const API_URL = 'https://api.thingspeak.com/channels/2858135/feeds.json?api_key=SKW4Z74VMRJ9LHVP';

const chartConfig = {
  backgroundGradientFrom: '#f5f5f5',
  backgroundGradientTo: '#e0e0e0',
  decimalPlaces: 2,
  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  propsForDots: { r: '4', strokeWidth: '2', stroke: '#ffa726' },
};

const VisualizationScreen = () => {
  const [data, setData] = useState<{ field1: string, field2: string, field3: string, field4: string, created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'pieChart', title: 'Pie Chart' },
    { key: 'lineChart1', title: 'Analysis of Right Shoulder' },
    { key: 'lineChart2', title: 'Analysis of Left Shoulder' },
    { key: 'lineChart3', title: 'Analysis of Upper Back' },
    { key: 'lineChart4', title: 'Analysis of Lower Back' },
    { key: 'emptyTab', title: 'Health Issues & Remedies' },
  ]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const [refresh, setRefresh] = useState(false);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_URL);
      const result = await response.json();
      setData(result.feeds || []);
      setRefresh(prev => !prev); 
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const getPieData = () => {
    if (!data.length) return [];

    let rightShoulderCount = 0;
    let leftShoulderCount = 0;
    let upperBackCount = 0;
    let lowerBackCount = 0;
    let totalCount = 0;

    // Iterate through the dataset
    data.forEach((entry) => {
        if (parseFloat(entry.field1) > 1) {
            rightShoulderCount++;
            totalCount++;
        }
        if (parseFloat(entry.field2) > 1) {
            leftShoulderCount++;
            totalCount++;
        }
        if (parseFloat(entry.field3) >= 1) {
            upperBackCount++;
            totalCount++;
        }
        if (parseFloat(entry.field4) >= 1) {
            lowerBackCount++;
            totalCount++;
        }
    });

    // Prevent division by zero
    if (totalCount === 0) return [];

    // Convert counts to percentages
    const rightShoulderPercentage = ((rightShoulderCount / totalCount) * 100).toFixed(2);
    const leftShoulderPercentage = ((leftShoulderCount / totalCount) * 100).toFixed(2);
    const upperBackPercentage = ((upperBackCount / totalCount) * 100).toFixed(2);
    const lowerBackPercentage = ((lowerBackCount / totalCount) * 100).toFixed(2);

    console.log("Pie Chart Data:", {
        rightShoulderPercentage,
        leftShoulderPercentage,
        upperBackPercentage,
        lowerBackPercentage
    });

    return [
        { name: 'Right Shoulder', population: parseFloat(rightShoulderPercentage), color: '#FF6384' },
        { name: 'Left Shoulder', population: parseFloat(leftShoulderPercentage), color: '#36A2EB' },
        { name: 'Upper Back', population: parseFloat(upperBackPercentage), color: '#FFCE56' },
        { name: 'Lower Back', population: parseFloat(lowerBackPercentage), color: '#4CAF50' },
    ];
};

  const getLineChartData = (field: string) => {
    return {
      labels: data.map(item => new Date(item.created_at).toLocaleTimeString()),
      datasets: [{ data: data.map(item => parseFloat(item[field as keyof typeof item]) || 0) }],
    };
  };

  const PieChartTab = () => (
    <ScrollView horizontal={true} contentContainerStyle={{ flexGrow: 1 }}>
    <View style={styles.content}>
      <Card style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Posture Distribution</Text>
        <PieChart
          data={getPieData()}
          width={screenWidth - 40}
          height={220}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          hasLegend={true}
          chartConfig={chartConfig}
        />
      </Card>
    </View>
    </ScrollView>
  );

  const LineChartTab = (field: string, title: string) => () => (
    <View style={styles.content}>
      <Card style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title} Trend</Text>
        <ScrollView horizontal={true} contentContainerStyle={{ flexGrow: 1 }}>
        <LineChart
          data={getLineChartData(field)}
          width={screenWidth - 40}
          height={400}
          chartConfig={chartConfig}
          bezier
          verticalLabelRotation={90}
          withDots
        />
        </ScrollView>
      </Card>
    </View>
  );

  const EmptyTab = () => (
    <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.cardContainer}>
      <Text style={styles.chartTitle}>Posture-Related Health Issues & Remedies</Text>
  
      <Card style={styles.myCard}>
        <Text style={styles.cardTitle}>🦴 Spine Curvature Issues</Text>
        <Text style={styles.cardText}>The three main curves of a properly aligned spine form an ‘S’ shape. Over time, poor posture can cause these natural curves to change shape, putting an excessive amount of pressure in the wrong position. Our spines are built to absorb shock, but bad posture can slowly deteriorate this natural ability, putting your body at risk for more serious injury in the future.
        </Text>
        <Text style={styles.cardText}>🔍 Why It Happens:</Text>
        <Text style={styles.cardText}>The spine has three natural curves that form an 'S' shape to absorb shock and distribute weight evenly<br/>
Slouching or improper posture alters these curves, putting uneven pressure on the spine.<br/>
Over time, spinal discs wear out, leading to pain and poor flexibility.
</Text>
        <Text style={styles.cardText}>✅ Remedies:</Text>
        <Text style={styles.cardText}>✔ Practice Proper Posture, ✔ Strengthen Core Muscles, ✔ Use Ergonomic Chairs, ✔ Stretch Regularly</Text>
      </Card>
  
      <Card style={styles.myCard}>
        <Text style={styles.cardTitle}>⚡ Back Pain</Text>
        <Text style={styles.cardText}>One of the most commonly known side effects of poor posture is unwanted strain on your upper and lower back. Slouching forward puts pressure between your shoulder blades and causes you to flatten your back muscles. If you notice pain below the neck and around your tailbone after a long day at work, you are likely not sitting up straight.</Text>
        <Text style={styles.cardText}>🔍 Why It Happens:</Text>
        <Text style={styles.cardText}>Slouching puts excessive pressure on the lower back (lumbar region).<br/>
Flattened back muscles cannot support the spine properly.<br/>
Leads to muscle imbalances, causing stiffness and pain.
</Text>
        <Text style={styles.cardText}>✅ Remedies:</Text>
        <Text style={styles.cardText}>✔ Sit with Proper Support, ✔ Avoid Long Sitting Hours, ✔ Strengthen Lower Back, ✔ Use Heat & Cold Therapy</Text>
      </Card>
  
      <Card style={styles.myCard}>
        <Text style={styles.cardTitle}>💡 Neck Pain & Headaches</Text>
        <Text style={styles.cardText}>Poor posture puts pressure on your posterior muscles, which has a negative impact on your neck. Whether your shoulders are hunched forward or your head is aimed downward, the strain put on your neck by the tightness of these muscles can lead to tension and headaches.
        </Text>
        <Text style={styles.cardText}>🔍 Why It Happens:</Text>
        <Text style={styles.cardText}>Hunching forward strains posterior neck muscles, causing tightness.<br/>
Looking down at screens increases pressure on the cervical spine (Tech Neck).<br/>
Muscle tension can trigger tension headaches.
</Text>
        <Text style={styles.cardText}>✅ Remedies:</Text>
        <Text style={styles.cardText}>✔ Keep Screen at Eye Level, ✔ Use a Supportive Pillow, ✔ Stretch Neck Muscles, ✔ Stay Hydrated & Manage Stress</Text>
      </Card>
  
      <Card style={styles.myCard}>
        <Text style={styles.cardTitle}>🌙 Poor Sleep</Text>
        <Text style={styles.cardText}>Deficient posture can put your entire system of muscles in a compromising position. If you are unable to fully relax your body at night, you may find yourself tossing and turning to find a comfortable position for your neck and back, which can lead to hours of lost sleep.
        </Text>
        <Text style={styles.cardText}>🔍 Why It Happens:</Text>
        <Text style={styles.cardText}>Poor posture during the day causes muscle tension, preventing proper relaxation at night.<br/>
Incorrect sleeping position leads to back pain and discomfort.<br/>
Spinal misalignment affects circulation and nerve function, leading to frequent waking up.
</Text>
        <Text style={styles.cardText}>✅ Remedies:</Text>
        <Text style={styles.cardText}>✔ Sleep in a Good Position, ✔ Use a Firm Mattress, ✔ Stretch Before Bed, ✔ Reduce Screen Time Before Sleep</Text>
      </Card>
  
      <Card style={styles.myCard}>
        <Text style={styles.cardTitle}>🍽️ Disrupted Digestion</Text>
        <Text style={styles.cardText}>If you have an office job that requires you to stay at a desk most of the day, sitting with bad posture can lead to digestive issues. Neglecting to pay attention to your posture can compress your organs, which can slow the digestive process and cause stomach issues.</Text>
        <Text style={styles.cardText}>🔍 Why It Happens:</Text>
        <Text style={styles.cardText}>Slouching compresses the abdominal organs, restricting their function.<br/>
Poor posture slows down digestion, leading to acid reflux, bloating, and constipation.<br/>
A hunched position can cause gastrointestinal discomfort by putting pressure on the stomach.
</Text>
        <Text style={styles.cardText}>✅ Remedies:</Text>
        <Text style={styles.cardText}>✔ Sit Upright While Eating, ✔ Walk After Meals, ✔ Strengthen Core, ✔ Stay Hydrated & Eat Fiber-Rich Foods</Text>
      </Card>
    </View>
    </ScrollView>
  );
  
  const renderScene: { [key: string]: () => JSX.Element } = {
    pieChart: PieChartTab,
    lineChart1: LineChartTab('field1', 'Right Shoulder'),
    lineChart2: LineChartTab('field2', 'Left Shoulder'),
    lineChart3: LineChartTab('field3', 'Upper Back'),
    lineChart4: LineChartTab('field4', 'Lower Back'),
    emptyTab: EmptyTab,
  };

  if (loading) return <ActivityIndicator size="large" color="#0056b3" style={styles.loader} />;

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={({ route }) => renderScene[route.key]()} 
      onIndexChange={setIndex}
      initialLayout={{ width: screenWidth }}
      renderTabBar={props => <TabBar {...props} style={styles.tabBar} indicatorStyle={styles.indicator} />}
    />
  );
};

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chartContainer: {
    width: '90%',
    padding: 16,
    marginVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 3,
  },
  chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  tabBar: { backgroundColor: '#007BFF' },
  indicator: { backgroundColor: 'white' },
  loader: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, textAlign:'center' },
  cardText: { fontSize: 14, marginBottom: 10, textAlign:'center', paddingStart:10, paddingEnd:10 },
  myCard:{margin: 10, textAlign:'center', width:'90%'},
  cardContainer:{display:'flex', justifyContent:'center', textAlign:'center', alignItems:'center'},
  container: {
    padding: 16,
  },
});

export default VisualizationScreen;