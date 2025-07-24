
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { tenaAPI, MedicineReminder } from '@/api/tena_api';
import { ArrowLeft, Plus, Clock, Pill, Bell, Trash2, Edit, Home } from 'lucide-react';

const MedicineReminderPage = () => {
  const [reminders, setReminders] = useState<MedicineReminder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<MedicineReminder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    frequency: 'Once daily',
    startDate: '',
    endDate: '',
    times: ['08:00'],
  });

  useEffect(() => {
    loadReminders();
    requestNotificationPermission();
  }, []);

  const loadReminders = async () => {
    setIsLoading(true);
    try {
      const data = await tenaAPI.getMedicineReminders();
      setReminders(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load reminders.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled",
          description: "You'll receive medicine reminders.",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingReminder) {
        await tenaAPI.updateMedicineReminder(editingReminder.id, {
          ...formData,
          isActive: editingReminder.isActive
        });
        toast({
          title: "Updated",
          description: "Medicine reminder updated successfully.",
        });
      } else {
        await tenaAPI.addMedicineReminder({
          ...formData,
          isActive: true
        });
        toast({
          title: "Added",
          description: "Medicine reminder added successfully.",
        });
      }
      
      setFormData({
        name: '',
        dosage: '',
        frequency: 'Once daily',
        startDate: '',
        endDate: '',
        times: ['08:00'],
      });
      setShowAddForm(false);
      setEditingReminder(null);
      loadReminders();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save reminder.",
        variant: "destructive",
      });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await tenaAPI.updateMedicineReminder(id, { isActive });
      loadReminders();
      toast({
        title: isActive ? "Activated" : "Deactivated",
        description: `Reminder ${isActive ? 'activated' : 'deactivated'}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reminder.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tenaAPI.deleteMedicineReminder(id);
      loadReminders();
      toast({
        title: "Deleted",
        description: "Reminder deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reminder.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (reminder: MedicineReminder) => {
    setEditingReminder(reminder);
    setFormData({
      name: reminder.name,
      dosage: reminder.dosage,
      frequency: reminder.frequency,
      startDate: reminder.startDate,
      endDate: reminder.endDate,
      times: reminder.times,
    });
    setShowAddForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-b border-blue-100 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-blue-100 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Medicine Reminders</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">የመድሃኒት ማሳሰቢያዎች</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/home')} className="hover:bg-blue-100 dark:hover:bg-gray-700">
              <Home className="w-5 h-5" />
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Add/Edit Form */}
        {showAddForm && (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
              </h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-900 dark:text-white">Medicine Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter medicine name"
                    required
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage" className="text-gray-900 dark:text-white">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="e.g., 1 tablet, 5ml"
                    required
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-900 dark:text-white">Frequency</Label>
                  <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-gray-900 dark:text-white">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-gray-900 dark:text-white">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                    {editingReminder ? 'Update' : 'Add'} Reminder
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowAddForm(false);
                    setEditingReminder(null);
                    setFormData({
                      name: '',
                      dosage: '',
                      frequency: 'Once daily',
                      startDate: '',
                      endDate: '',
                      times: ['08:00'],
                    });
                  }} className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Reminders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-1/2"></div>
                    </div>
                    <div className="w-12 h-6 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((reminder) => (
              <Card key={reminder.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-sm border-0">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Pill className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{reminder.name}</h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{reminder.dosage} - {reminder.frequency}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                        <div className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {reminder.times.join(', ')}
                        </div>
                        <div className="flex items-center">
                          <Bell className="w-3 h-3 mr-1" />
                          {reminder.startDate} - {reminder.endDate}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Switch
                        checked={reminder.isActive}
                        onCheckedChange={(checked) => handleToggle(reminder.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(reminder)}
                        className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reminder.id)}
                        className="w-8 h-8 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && reminders.length === 0 && (
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0">
            <CardContent className="p-8 text-center">
              <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">No reminders yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Add your first medicine reminder to get started</p>
              <Button onClick={() => setShowAddForm(true)} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Reminder
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MedicineReminderPage;
