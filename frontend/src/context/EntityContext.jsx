import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from './AuthContext';

const EntityContext = createContext(null);

export const EntityProvider = ({ children }) => {
    const { user } = useAuth();
    const [entities, setEntities] = useState([]);
    const [selectedEntity, setSelectedEntity] = useState(() => {
        return null; // We only store ID, need to resolve object from entities list later or store full object. 
        // Better: store ID, auto-select from fetched entities.
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            fetchEntities();
        } else {
            setEntities([]);
            setSelectedEntity(null);
            localStorage.removeItem('selectedEntityId');
        }
    }, [user]);

    const fetchEntities = async () => {
        setLoading(true);
        try {
            const response = await api.get('/entities');
            setEntities(response.data);

            if (response.data.length > 0) {
                const savedId = localStorage.getItem('selectedEntityId');
                let target = null;

                if (savedId) {
                    target = response.data.find(e => e.id === Number(savedId));
                }

                if (!target) {
                    target = response.data[0];
                }

                if (!selectedEntity || selectedEntity.id !== target.id) {
                    setSelectedEntity(target);
                    localStorage.setItem('selectedEntityId', target.id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch entities', error);
        } finally {
            setLoading(false);
        }
    };

    const switchEntity = (entityId) => {
        const entity = entities.find(e => e.id === Number(entityId));
        if (entity) {
            setSelectedEntity(entity);
            localStorage.setItem('selectedEntityId', entity.id);
        }
    };

    return (
        <EntityContext.Provider value={{ entities, selectedEntity, loading, fetchEntities, switchEntity }}>
            {children}
        </EntityContext.Provider>
    );
};

export const useEntity = () => useContext(EntityContext);
