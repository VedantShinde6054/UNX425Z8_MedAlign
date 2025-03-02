import React, { useState, useEffect, useCallback } from 'react';
import { 
  Text, FlatList, RefreshControl, StyleSheet, 
  View, SafeAreaView, StatusBar, ActivityIndicator, Dimensions 
} from 'react-native';

interface FeedItem {
  entry_id: number;
  field1?: string;
  field2?: string;
  field3?: string;
  field4?: string;
  created_at?: string;
}

interface ChannelInfo {
  name?: string;
}

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const [data, setData] = useState<FeedItem[]>([]);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo>({});
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://api.thingspeak.com/channels/2858135/feeds.json?api_key=SKW4Z74VMRJ9LHVP'
      );
      const result = await response.json();
      const sortedData = (result.feeds || []).sort(
        (a: FeedItem, b: FeedItem) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
      );
      setData(sortedData);
      setChannelInfo(result.channel || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000); 
    return () => clearInterval(interval);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getLastUpdatedTime = () => {
    if (data.length > 0) {
      const lastEntryTime = new Date(data[data.length - 1].created_at!);
      const currentTime = new Date();
      const timeDiff = (currentTime.getTime() - lastEntryTime.getTime()) / 60000;
      
      if (timeDiff < 60) {
        return `${Math.floor(timeDiff)} min ago`;
      } else {
        return lastEntryTime.toLocaleString();
      }
    }
    return 'N/A';
  };

  const renderItem = ({ item }: { item: FeedItem }) => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Data Entry (ID: {item.entry_id})</Text>
      <Text style={styles.cardText}>Shoulder 1: {item.field1 || '0'}</Text>
      <Text style={styles.cardText}>Shoulder 2: {item.field2 || '0'}</Text>
      <Text style={styles.cardText}>Upper Back: {item.field3 || '0'}</Text>
      <Text style={styles.cardText}>Lower Back: {item.field4 || '0'}</Text>
      <Text style={styles.cardTimestamp}>
        Created At: {item.created_at ? new Date(item.created_at).toLocaleString() : 'N/A'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#0056b3" barStyle="light-content" /> 
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>{channelInfo?.name || 'Posture Detector'}</Text>
        <Text style={styles.updatedText}>
          Last Updated: {getLastUpdatedTime()}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0056b3" style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.entry_id.toString()}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E8ECF4' },
  titleContainer: { backgroundColor: '#0056b3', width: '100%', paddingVertical: 20, alignItems: 'center' },
  titleText: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF' },
  updatedText: { fontSize: 14, color: '#E0E0E0', marginTop: 5 },
  listContainer: { flexGrow: 1, padding: 16, alignItems: 'center' },
  card: { padding: 20, marginVertical: 10, width: width * 0.9, backgroundColor: '#FFFFFF', borderRadius: 15, elevation: 3 },
  cardTitle: { fontSize: 20, fontWeight: 'bold' },
  cardText: { fontSize: 16, marginTop: 8 },
  cardTimestamp: { fontSize: 14, color: '#777', marginTop: 12 },
  loader: { marginTop: 50 },
});

export default HomeScreen;
