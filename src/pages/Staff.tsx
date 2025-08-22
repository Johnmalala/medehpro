import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, User, AlertTriangle } from 'lucide-react';
import { Staff } from '../types';
import { supabase } from '../lib/supabase';
import Loader from '../components/Layout/Loader';
import { useAuth } from '../hooks/useAuth';

const StaffPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  const initialFormState = {
    name: '',
    email: '',
    role: 'Cashier' as 'Owner' | 'Manager' | 'Cashier',
    status: 'Active' as 'Active' | 'Inactive',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchStaff = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) console.error("Error fetching staff:", error);
    else setStaff(data as Staff[] || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError('');

    if (editingStaff) {
      // Update existing staff profile
      const { error } = await supabase
        .from('staff')
        .update({ name: formData.name, email: formData.email, role: formData.role, status: formData.status })
        .eq('id', editingStaff.id);
      
      if (error) {
        setFormError('Failed to update staff member.');
      } else {
        await fetchStaff();
        if (user?.email === formData.email) {
          await refreshUser();
        }
        closeModal();
      }
    } else {
      // Create new staff profile
      const { error } = await supabase.from('staff').insert({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
      });

      if (error) {
        setFormError('Failed to create staff profile. A profile with this email may already exist.');
      } else {
        await fetchStaff();
        closeModal();
      }
    }
    
    setIsSubmitting(false);
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      status: staffMember.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (staffId: string) => {
    if (confirm('Are you sure you want to remove this staff profile? This does NOT delete their login account.')) {
      const { error } = await supabase.from('staff').delete().eq('id', staffId);
      if (error) alert('Failed to delete staff member.');
      else await fetchStaff();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStaff(null);
    setFormData(initialFormState);
    setFormError('');
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1><p className="text-gray-600 dark:text-gray-400 mt-1">Manage your team members and their roles</p></div>
        <button onClick={() => setShowModal(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors w-full sm:w-auto"><Plus className="w-4 h-4" /><span>Add Staff</span></button>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-600 p-4">
        <div className="flex">
          <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-yellow-400 dark:text-yellow-500" /></div>
          <div className="ml-3"><p className="text-sm text-yellow-700 dark:text-yellow-200"><b>Important:</b> To add a new staff member, first create their login in the Supabase dashboard, then add their profile here using the same email.</p></div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{editingStaff ? 'Edit Staff Member' : 'Add New Staff Profile'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg" required /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"><option value="Cashier">Cashier</option><option value="Manager">Manager</option><option value="Owner">Owner</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
              
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <button type="button" onClick={closeModal} className="w-full sm:w-auto flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg disabled:bg-blue-300">
                  {isSubmitting ? 'Saving...' : (editingStaff ? 'Update Staff' : 'Add Staff')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700"><h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Staff Members ({staff.length})</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[768px]">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {staff.map((staffMember) => (
                <tr key={staffMember.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex-shrink-0 flex items-center justify-center mr-3"><User className="w-4 h-4 text-blue-600 dark:text-blue-400" /></div><div className="text-sm font-medium text-gray-900 dark:text-white">{staffMember.name}</div></div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900 dark:text-white">{staffMember.role}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${staffMember.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{staffMember.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium"><div className="flex space-x-2"><button onClick={() => handleEdit(staffMember)} className="text-blue-600 hover:text-blue-900"><Edit className="w-4 h-4" /></button><button onClick={() => handleDelete(staffMember.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffPage;
