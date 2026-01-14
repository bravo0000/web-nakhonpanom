/**
 * Custom Hooks for App Settings
 * ดึงข้อมูลจาก database เป็นแหล่งเดียว (Single Source of Truth)
 */

import { useState, useEffect } from 'react';
import { fetchAppSetting } from './auth';
import { INITIAL_WORKFLOWS, INITIAL_DEPT_SETTINGS, INITIAL_JOB_TYPES } from '../config/constants';

/**
 * Hook สำหรับดึง Workflows จาก database
 * @returns {{ workflows: object, loading: boolean, error: string | null }}
 */
export function useWorkflows() {
    const [workflows, setWorkflows] = useState(INITIAL_WORKFLOWS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadWorkflows = async () => {
            try {
                const data = await fetchAppSetting('workflows', INITIAL_WORKFLOWS);
                setWorkflows(data);
            } catch (err) {
                console.error('Error loading workflows:', err);
                setError(err.message);
                // Fallback to initial data
                setWorkflows(INITIAL_WORKFLOWS);
            } finally {
                setLoading(false);
            }
        };

        loadWorkflows();
    }, []);

    return { workflows, loading, error };
}

/**
 * Hook สำหรับดึง Department Settings จาก database
 * @returns {{ deptSettings: object, loading: boolean, error: string | null }}
 */
export function useDeptSettings() {
    const [deptSettings, setDeptSettings] = useState(INITIAL_DEPT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const data = await fetchAppSetting('dept_settings', INITIAL_DEPT_SETTINGS);
                setDeptSettings(data);
            } catch (err) {
                console.error('Error loading dept settings:', err);
                setError(err.message);
                setDeptSettings(INITIAL_DEPT_SETTINGS);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    return { deptSettings, loading, error };
}

/**
 * Hook สำหรับดึง Job Types จาก database
 * @returns {{ jobTypes: object, loading: boolean, error: string | null }}
 */
export function useJobTypes() {
    const [jobTypes, setJobTypes] = useState(INITIAL_JOB_TYPES);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadJobTypes = async () => {
            try {
                const data = await fetchAppSetting('job_types', INITIAL_JOB_TYPES);
                setJobTypes(data);
            } catch (err) {
                console.error('Error loading job types:', err);
                setError(err.message);
                setJobTypes(INITIAL_JOB_TYPES);
            } finally {
                setLoading(false);
            }
        };

        loadJobTypes();
    }, []);

    return { jobTypes, loading, error };
}

/**
 * Combined hook สำหรับดึง Settings ทั้งหมดพร้อมกัน
 * ใช้เมื่อต้องการข้อมูลหลายอย่างพร้อมกัน
 * @returns {{ 
 *   workflows: object, 
 *   deptSettings: object, 
 *   jobTypes: object, 
 *   loading: boolean, 
 *   error: string | null 
 * }}
 */
export function useAppSettings() {
    const [settings, setSettings] = useState({
        workflows: INITIAL_WORKFLOWS,
        deptSettings: INITIAL_DEPT_SETTINGS,
        jobTypes: INITIAL_JOB_TYPES
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadAllSettings = async () => {
            try {
                const [workflows, deptSettings, jobTypes] = await Promise.all([
                    fetchAppSetting('workflows', INITIAL_WORKFLOWS),
                    fetchAppSetting('dept_settings', INITIAL_DEPT_SETTINGS),
                    fetchAppSetting('job_types', INITIAL_JOB_TYPES)
                ]);

                setSettings({ workflows, deptSettings, jobTypes });
            } catch (err) {
                console.error('Error loading app settings:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadAllSettings();
    }, []);

    return { ...settings, loading, error };
}
