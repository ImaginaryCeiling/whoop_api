'use client';

import { useState, useEffect } from 'react';
import { WhoopApiClient } from '@/lib/whoop-api';
import {
  WhoopUser,
  WhoopBodyMeasurement,
  WhoopRecovery,
  WhoopSleep,
  WhoopWorkout,
  WhoopCycle
} from '@/types/whoop';

interface WhoopDashboardProps {
  accessToken: string;
}

export default function WhoopDashboard({ accessToken }: WhoopDashboardProps) {
  const [user, setUser] = useState<WhoopUser | null>(null);
  const [bodyMeasurements, setBodyMeasurements] = useState<WhoopBodyMeasurement | null>(null);
  const [latestRecovery, setLatestRecovery] = useState<WhoopRecovery | null>(null);
  const [latestSleep, setLatestSleep] = useState<WhoopSleep | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WhoopWorkout[]>([]);
  const [latestCycle, setLatestCycle] = useState<WhoopCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAccessToken, setCurrentAccessToken] = useState(accessToken);

  const handleTokenRefresh = (newToken: string) => {
    setCurrentAccessToken(newToken);
  };

  const handleAuthenticationExpired = () => {
    localStorage.removeItem('whoop_access_token');
    localStorage.removeItem('whoop_refresh_token');
    window.location.reload();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const client = new WhoopApiClient(currentAccessToken, handleTokenRefresh);
        
        const [
          userData,
          bodyData,
          recoveryData,
          sleepData,
          workoutData,
          cycleData
        ] = await Promise.all([
          client.getUser(),
          client.getBodyMeasurements(),
          client.getRecoveries(1),
          client.getSleeps(1),
          client.getWorkouts(5),
          client.getCycles(1)
        ]);

        setUser(userData);
        setBodyMeasurements(bodyData);
        setLatestRecovery(recoveryData.records[0] || null);
        setLatestSleep(sleepData.records[0] || null);
        setRecentWorkouts(workoutData.records || []);
        setLatestCycle(cycleData.records[0] || null);
      } catch (err) {
        if (err instanceof Error && err.message === 'AUTHENTICATION_EXPIRED') {
          handleAuthenticationExpired();
          return;
        }
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentAccessToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading your Whoop data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  const formatTime = (milli: number) => {
    const hours = Math.floor(milli / (1000 * 60 * 60));
    const minutes = Math.floor((milli % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Whoop Dashboard
              </h1>
              {user && (
                <p className="text-gray-600">
                  Welcome back, {user.first_name} {user.last_name}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                const client = new WhoopApiClient(currentAccessToken, handleTokenRefresh);
                
                Promise.all([
                  client.getUser(),
                  client.getBodyMeasurements(),
                  client.getRecoveries(1),
                  client.getSleeps(1),
                  client.getWorkouts(5),
                  client.getCycles(1)
                ]).then(([userData, bodyData, recoveryData, sleepData, workoutData, cycleData]) => {
                  setUser(userData);
                  setBodyMeasurements(bodyData);
                  setLatestRecovery(recoveryData.records[0] || null);
                  setLatestSleep(sleepData.records[0] || null);
                  setRecentWorkouts(workoutData.records || []);
                  setLatestCycle(cycleData.records[0] || null);
                }).catch((err) => {
                  if (err instanceof Error && err.message === 'AUTHENTICATION_EXPIRED') {
                    handleAuthenticationExpired();
                    return;
                  }
                  setError(err instanceof Error ? err.message : 'An error occurred');
                }).finally(() => {
                  setLoading(false);
                });
              }}
              disabled={loading}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {latestRecovery && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-green-700">Recovery Score</h3>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {latestRecovery.score.recovery_score}%
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Resting HR: {latestRecovery.score.resting_heart_rate} bpm</p>
                <p>HRV: {latestRecovery.score.hrv_rmssd_milli.toFixed(1)} ms</p>
                <p>SpO2: {latestRecovery.score.spo2_percentage.toFixed(1)}%</p>
              </div>
            </div>
          )}

          {latestCycle && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-orange-700">Daily Strain</h3>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {latestCycle.score.strain.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Avg HR: {latestCycle.score.average_heart_rate} bpm</p>
                <p>Max HR: {latestCycle.score.max_heart_rate} bpm</p>
                <p>Calories: {Math.round(latestCycle.score.kilojoule / 4.184)} kcal</p>
              </div>
            </div>
          )}

          {latestSleep && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-blue-700">Sleep Performance</h3>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {latestSleep.score.sleep_performance_percentage}%
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Total Sleep: {formatTime(latestSleep.score.stage_summary.total_in_bed_time_milli - latestSleep.score.stage_summary.total_awake_time_milli)}</p>
                <p>Efficiency: {latestSleep.score.sleep_efficiency_percentage}%</p>
                <p>Respiratory Rate: {latestSleep.score.respiratory_rate.toFixed(1)} bpm</p>
              </div>
            </div>
          )}
        </div>

        {bodyMeasurements && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Body Measurements</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {(bodyMeasurements.height_meter * 3.28084).toFixed(1)}&quot;
                </div>
                <div className="text-sm text-gray-600">Height</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {(bodyMeasurements.weight_kilogram * 2.20462).toFixed(1)} lbs
                </div>
                <div className="text-sm text-gray-600">Weight</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {bodyMeasurements.max_heart_rate} bpm
                </div>
                <div className="text-sm text-gray-600">Max Heart Rate</div>
              </div>
            </div>
          </div>
        )}

        {recentWorkouts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Recent Workouts</h3>
            <div className="space-y-4">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-gray-800">
                      Workout #{workout.id}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(workout.start)}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Strain:</span>
                      <span className="ml-1 font-medium">{workout.score.strain.toFixed(1)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Avg HR:</span>
                      <span className="ml-1 font-medium">{workout.score.average_heart_rate} bpm</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Max HR:</span>
                      <span className="ml-1 font-medium">{workout.score.max_heart_rate} bpm</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Calories:</span>
                      <span className="ml-1 font-medium">{Math.round(workout.score.kilojoule / 4.184)} kcal</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}